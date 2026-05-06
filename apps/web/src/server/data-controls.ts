import { createServerFn } from '@tanstack/react-start'
import { db } from '@amore-couples/db'
import {
  chatExports,
  messages,
} from '@amore-couples/db/schema'
import {
  and,
  count,
  desc,
  eq,
} from 'drizzle-orm'
import { requireAuth } from './require-couple'

export interface ImportDataSummary {
  exportCount: number
  importedMessageCount: number
  latestExportAt: string | null
}

async function getImportSummaryForUser(userId: string): Promise<ImportDataSummary> {
  const [exports, messageAggregate] = await Promise.all([
    db.query.chatExports.findMany({
      where: eq(chatExports.userId, userId),
      orderBy: [desc(chatExports.createdAt)],
      columns: {
        createdAt: true,
      },
    }),
    db
      .select({ value: count() })
      .from(messages)
      .where(and(
        eq(messages.senderId, userId),
        eq(messages.source, 'export'),
      )),
  ])

  return {
    exportCount: exports.length,
    importedMessageCount: Number(messageAggregate[0]?.value ?? 0),
    latestExportAt: exports[0]?.createdAt?.toISOString() ?? null,
  }
}

export const getImportDataSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()
    return getImportSummaryForUser(session.user.id)
  },
)

export const exportMyImportData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireAuth()
    const userId = session.user.id

    const [summary, imports] = await Promise.all([
      getImportSummaryForUser(userId),
      db.query.chatExports.findMany({
        where: eq(chatExports.userId, userId),
        orderBy: [desc(chatExports.createdAt)],
        columns: {
          id: true,
          filename: true,
          messageCount: true,
          dateRangeStart: true,
          dateRangeEnd: true,
          senderNames: true,
          userSenderName: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    function normalizeSenderNames(value: unknown): string[] {
      if (!Array.isArray(value)) return []
      return value.map((item) => String(item))
    }

    return {
      exportedAt: new Date().toISOString(),
      scope: 'whatsapp_imports',
      summary,
      imports: imports.map((item) => ({
        ...item,
        dateRangeStart: item.dateRangeStart?.toISOString() ?? null,
        dateRangeEnd: item.dateRangeEnd?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        senderNames: normalizeSenderNames(item.senderNames),
      })),
    }
  },
)

export const deleteMyImportedWhatsAppData = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await requireAuth()
    const userId = session.user.id
    const before = await getImportSummaryForUser(userId)

    await db.transaction(async (tx) => {
      await tx.delete(messages).where(and(
        eq(messages.senderId, userId),
        eq(messages.source, 'export'),
      ))

      await tx.delete(chatExports).where(eq(chatExports.userId, userId))
    })

    return {
      ok: true,
      deletedExports: before.exportCount,
      deletedImportedMessages: before.importedMessageCount,
    }
  },
)
