# WhatsApp Media Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** View images, videos, stickers, and other media shared in WhatsApp chats — both in history and live messages.

**Architecture:** Persist JPEG thumbnails in the messages table (tiny, ~5-20KB base64) for instant previews. Download full media at ingest time via Baileys' `downloadMediaMessage()` and store base64 in a separate `message_media` table. Serve media via a wa-bridge endpoint, proxied through the web app. Frontend shows thumbnails everywhere; click to open full-res in a lightbox.

**Tech Stack:** Baileys `downloadMediaMessage`, Drizzle ORM, Hono (wa-bridge), Nitro/h3 (web app), React lightbox component.

---

### Task 1: DB Schema — Add Thumbnail + Media Storage

**Files:**
- Modify: `packages/db/src/schema.ts:89-107` (messages table)
- Modify: `packages/db/src/schema.ts` (add new table after messages)

**Step 1: Add `thumbnail` column to messages table**

In `packages/db/src/schema.ts`, add the `thumbnail` column to the `messages` table definition (after `mediaType`, before `source`):

```typescript
// Inside the messages pgTable definition, after line 98:
  mediaType: varchar('media_type', { length: 20 }),
  thumbnail: text('thumbnail'),  // base64 JPEG thumbnail from Baileys
  source: varchar('source', { length: 20 }).notNull().default('baileys'),
```

**Step 2: Add `messageMedia` table**

After the `messages` table definition (after the closing `])`), add:

```typescript
// ── Message Media (full-resolution media files) ──────────
export const messageMedia = pgTable('message_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  waMessageId: varchar('wa_message_id', { length: 255 }).notNull(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id),
  data: text('data').notNull(),          // base64-encoded media binary
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),  // original size in bytes
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('message_media_wa_id_unique')
    .on(table.coupleId, table.waMessageId),
])
```

Make sure to import `integer` from `drizzle-orm/pg-core` if not already imported.

**Step 3: Push schema**

```bash
cd packages/db && npx drizzle-kit push
```

**Step 4: Commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat: add thumbnail column and message_media table for media support"
```

---

### Task 2: Persist Thumbnails at Ingest Time (wa-bridge)

**Files:**
- Modify: `apps/wa-bridge/src/messages/ingest.ts:12-21` (NormalizedMessage interface)
- Modify: `apps/wa-bridge/src/messages/ingest.ts:52-98` (normalizeMessage function)

**Step 1: Add `thumbnail` to `NormalizedMessage`**

In `apps/wa-bridge/src/messages/ingest.ts`, update the interface (line 12-21):

```typescript
export interface NormalizedMessage {
  coupleId: string
  waMessageId: string
  senderId: string
  text: string | null
  timestamp: Date
  isMedia: boolean
  mediaType: string | null
  thumbnail: string | null  // base64 JPEG thumbnail
  source: 'baileys'
}
```

**Step 2: Extract thumbnail in `normalizeMessage`**

In the `normalizeMessage` function, extract the thumbnail and include it in the return value. Add after `isMedia` computation (around line 80-81):

```typescript
  // Extract JPEG thumbnail for image/video/sticker
  const jpegThumbnail =
    msg.message.imageMessage?.jpegThumbnail ||
    msg.message.videoMessage?.jpegThumbnail ||
    msg.message.stickerMessage?.pngThumbnail ||
    null
  const thumbnail = jpegThumbnail
    ? Buffer.from(jpegThumbnail).toString('base64')
    : null
```

Then add `thumbnail` to the return object (line 88-97):

```typescript
  return {
    coupleId,
    waMessageId: key.id,
    senderId,
    text,
    timestamp: new Date(ts * 1000),
    isMedia,
    mediaType,
    thumbnail,
    source: 'baileys',
  }
```

**Step 3: Build check**

```bash
cd apps/wa-bridge && npx tsc --noEmit
```

The `thumbnail` field is now part of `NormalizedMessage` which is spread into the Drizzle insert in `persistMessages()`. Since we added the `thumbnail` column to the `messages` table schema, Drizzle will include it in the INSERT automatically.

**Step 4: Commit**

```bash
git add apps/wa-bridge/src/messages/ingest.ts
git commit -m "feat: extract and persist JPEG thumbnails from WhatsApp media messages"
```

---

### Task 3: Include Thumbnails in WS Proxy (History + Live)

**Files:**
- Modify: `apps/web/server/routes/ws/chat.ts:196-211` (live message persistence)
- Modify: `apps/web/server/routes/ws/chat.ts:397-424` (history loading)
- Modify: `apps/web/server/routes/ws/chat.ts:350-368` (prod sync)

**Step 1: Persist thumbnail from live messages**

In `routeBridgeMessage()`, the live message case (around line 196-211), add `thumbnail` to the DB insert:

```typescript
      // Persist to local DB so history stays fresh
      if (waMessageId && timestamp) {
        const senderId = fromMe ? state.userId : state.partnerId
        db.insert(messages)
          .values({
            coupleId: state.coupleId,
            waMessageId,
            senderId,
            text: text ?? null,
            timestamp: new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp),
            isMedia: isMedia ?? false,
            mediaType,
            thumbnail: thumbnail ?? null,
            source: 'baileys',
          })
          .onConflictDoNothing()
          .catch(() => { /* best-effort local persistence */ })
      }
```

**Step 2: Include thumbnail in history query**

In `handleLoadHistory()` (around line 397-406), add `thumbnail` to the select:

```typescript
    const rows = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        text: messages.text,
        timestamp: messages.timestamp,
        isMedia: messages.isMedia,
        mediaType: messages.mediaType,
        thumbnail: messages.thumbnail,
        waMessageId: messages.waMessageId,
      })
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.timestamp))
      .limit(limit)
```

And include it in the mapped output (around line 415-424):

```typescript
    const mapped = rows
      .filter((m) => m.text || m.isMedia)
      .map((m) => ({
        id: m.id,
        sender: m.senderId === state.userId ? 'You' : state.partnerName,
        text: m.text,
        timestamp: m.timestamp,
        fromMe: m.senderId === state.userId,
        isMedia: m.isMedia,
        mediaType: m.mediaType,
        thumbnail: m.thumbnail,
        waMessageId: m.waMessageId,
      }))
```

**Step 3: Include thumbnail in prod sync**

In `syncMessagesFromProd()` (around line 350-368), add `thumbnail` to the insert values:

```typescript
        await db.insert(messages)
          .values({
            coupleId: state.coupleId,
            waMessageId: m.wa_message_id,
            senderId: localSenderId,
            text: m.text,
            timestamp: m.timestamp,
            sentiment: m.sentiment,
            isMedia: m.is_media,
            mediaType: m.media_type,
            thumbnail: m.thumbnail,
            source: m.source,
          })
          .onConflictDoNothing()
```

**Step 4: Build check**

```bash
pnpm run build
```

**Step 5: Commit**

```bash
git add apps/web/server/routes/ws/chat.ts
git commit -m "feat: include thumbnails in chat history and live message persistence"
```

---

### Task 4: Download Full Media at Ingest Time (wa-bridge)

**Files:**
- Create: `apps/wa-bridge/src/messages/media.ts`
- Modify: `apps/wa-bridge/src/sessions/manager.ts:448-465` (normalizeAndPersist)
- Modify: `apps/wa-bridge/src/sessions/manager.ts:1-21` (imports)

**Step 1: Create media download utility**

Create `apps/wa-bridge/src/messages/media.ts`:

```typescript
import { downloadMediaMessage, type WAMessage, type WASocket } from '@whiskeysockets/baileys'
import { db } from '@amore-couples/db/client'
import { messageMedia } from '@amore-couples/db/schema'
import { log } from '../logger.js'

const MAX_MEDIA_SIZE = 16 * 1024 * 1024 // 16MB limit

const MEDIA_MIME_MAP: Record<string, string> = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/ogg',
  sticker: 'image/webp',
  document: 'application/octet-stream',
}

/**
 * Download media from a WhatsApp message and store it in the DB.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function downloadAndStoreMedia(
  msg: WAMessage,
  coupleId: string,
  sock: WASocket,
): Promise<void> {
  const waMessageId = msg.key?.id
  if (!waMessageId || !msg.message) return

  // Determine media type from the message
  const m = msg.message
  const mediaMsg = m.imageMessage || m.videoMessage || m.audioMessage || m.stickerMessage || m.documentMessage
  if (!mediaMsg) return

  // Get MIME type from the message or fall back to map
  const mimeType =
    (mediaMsg as { mimetype?: string }).mimetype ||
    MEDIA_MIME_MAP[
      m.imageMessage ? 'image' :
      m.videoMessage ? 'video' :
      m.audioMessage ? 'audio' :
      m.stickerMessage ? 'sticker' : 'document'
    ]

  try {
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: log as any,
        reuploadRequest: sock.updateMediaMessage,
      },
    )

    if (buffer.length > MAX_MEDIA_SIZE) {
      log.info({ waMessageId, size: buffer.length }, 'Skipping media: exceeds size limit')
      return
    }

    const base64 = buffer.toString('base64')

    await db.insert(messageMedia)
      .values({
        waMessageId,
        coupleId,
        data: base64,
        mimeType,
        fileSize: buffer.length,
      })
      .onConflictDoNothing()

    log.info({ waMessageId, size: buffer.length, mimeType }, 'Media stored')
  } catch (err) {
    log.error({ err, waMessageId }, 'Media download failed')
  }
}
```

**Step 2: Call from `normalizeAndPersist` in manager**

In `apps/wa-bridge/src/sessions/manager.ts`, add the import at the top (around line 10-16):

```typescript
import { downloadAndStoreMedia } from '../messages/media.js'
```

Then modify `normalizeAndPersist` (line 448-465) to fire-and-forget media downloads after persistence:

```typescript
  private async normalizeAndPersist(
    msgs: proto.IWebMessageInfo[],
    sessionId: string,
    binding: CoupleBinding,
  ): Promise<void> {
    const normalized = msgs
      .map((msg) => normalizeMessage(msg, binding.coupleId, binding.connectedUserId, binding.partnerUserId))
      .filter((m): m is NormalizedMessage => m !== null)

    if (normalized.length > 0) {
      const count = await persistMessages(normalized)
        .catch((err) => { log.error({ err, sessionId, coupleId: binding.coupleId }, 'Message persist failed'); return 0 })
      if (count > 0) {
        log.info({ sessionId, coupleId: binding.coupleId, count }, 'Messages persisted')
        this.emit('messages-persisted', { sessionId, coupleId: binding.coupleId, count })
      }
    }

    // Fire-and-forget: download and store media for media messages
    const session = this.sessions.get(sessionId)
    if (session) {
      for (const msg of msgs) {
        const mediaType = msg.message ? getMediaType(msg.message) : null
        if (mediaType) {
          downloadAndStoreMedia(msg as WAMessage, binding.coupleId, session.socket)
            .catch(() => { /* already logged inside */ })
        }
      }
    }
  }
```

Also add the `getMediaType` import if not already imported in manager.ts (check imports from ingest.js — it currently imports `normalizeMessage`, `persistMessages`, `handleMessageRevoke`, `getOldestMessage`, `NormalizedMessage`):

```typescript
import {
  normalizeMessage,
  persistMessages,
  handleMessageRevoke,
  getOldestMessage,
  getMediaType,
  type NormalizedMessage,
} from '../messages/ingest.js'
```

**Step 3: Export `messageMedia` from db package**

Check that `packages/db/src/schema.ts` exports `messageMedia` (it should be auto-exported since it's a `const` at module level). Verify the db package's barrel export includes it.

**Step 4: Build check**

```bash
pnpm run build
```

**Step 5: Commit**

```bash
git add apps/wa-bridge/src/messages/media.ts apps/wa-bridge/src/sessions/manager.ts
git commit -m "feat: download and store full WhatsApp media at ingest time"
```

---

### Task 5: Media Serving Endpoint (wa-bridge)

**Files:**
- Modify: `apps/wa-bridge/src/index.ts` (add GET /media/:waMessageId route)

**Step 1: Add media endpoint**

In `apps/wa-bridge/src/index.ts`, after the existing route definitions (look for the pattern of `app.get(...)` routes), add:

```typescript
import { messageMedia } from '@amore-couples/db/schema'
import { eq, and } from 'drizzle-orm'
import { db } from '@amore-couples/db/client'
```

Note: `db` and schema imports may already exist at the top. Check and only add what's missing.

Add the route (before the `serve()` call at the bottom of the file):

```typescript
// ── Media serving ────────────────────────────────────────────
app.get('/media/:waMessageId', async (c) => {
  // Verify JWT auth
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const token = authHeader.slice(7)
    const { payload } = await jwtVerify(token, jwtSecretKey)
    const coupleId = payload.coupleId as string
    if (!coupleId) return c.json({ error: 'Invalid token' }, 401)

    const waMessageId = c.req.param('waMessageId')

    const [media] = await db
      .select({
        data: messageMedia.data,
        mimeType: messageMedia.mimeType,
      })
      .from(messageMedia)
      .where(
        and(
          eq(messageMedia.waMessageId, waMessageId),
          eq(messageMedia.coupleId, coupleId),
        ),
      )
      .limit(1)

    if (!media) {
      return c.json({ error: 'Not found' }, 404)
    }

    const buffer = Buffer.from(media.data, 'base64')
    return new Response(buffer, {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})
```

**Step 2: Build check**

```bash
cd apps/wa-bridge && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add apps/wa-bridge/src/index.ts
git commit -m "feat: add /media/:waMessageId endpoint to serve stored media"
```

---

### Task 6: Media Proxy on Web App

**Files:**
- Create: `apps/web/server/routes/api/media/[waMessageId].ts`

**Step 1: Create the proxy route**

Create `apps/web/server/routes/api/media/[waMessageId].ts`:

```typescript
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { SignJWT } from 'jose'
import { auth } from '../../../../src/lib/auth'
import { db } from '@amore-couples/db'
import { couples } from '@amore-couples/db/schema'
import { eq, or } from 'drizzle-orm'

const WA_BRIDGE_URL = process.env.WA_BRIDGE_URL || 'http://localhost:9945'
const WA_BRIDGE_JWT_SECRET = process.env.WA_BRIDGE_JWT_SECRET || ''
const jwtSecretKey = new TextEncoder().encode(WA_BRIDGE_JWT_SECRET)

export default defineEventHandler(async (event) => {
  // Auth check
  const session = await auth.api.getSession({
    headers: event.headers,
  })
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = session.user.id
  const waMessageId = getRouterParam(event, 'waMessageId')
  if (!waMessageId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing waMessageId' })
  }

  // Look up couple for JWT
  const couple = await db.query.couples.findFirst({
    where: or(
      eq(couples.userAId, userId),
      eq(couples.userBId, userId),
    ),
  })
  if (!couple) {
    throw createError({ statusCode: 404, statusMessage: 'No couple found' })
  }

  // Sign JWT for wa-bridge
  const token = await new SignJWT({
    coupleId: couple.id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('1m')
    .sign(jwtSecretKey)

  // Proxy to wa-bridge
  const response = await fetch(`${WA_BRIDGE_URL}/media/${waMessageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: response.status === 404 ? 'Media not available' : 'Media fetch failed',
    })
  }

  // Forward the response
  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

  event.node.res.setHeader('Content-Type', contentType)
  event.node.res.setHeader('Cache-Control', 'private, max-age=86400')
  event.node.res.end(Buffer.from(buffer))
})
```

**Step 2: Create the directory if needed**

```bash
mkdir -p apps/web/server/routes/api/media
```

**Step 3: Build check**

```bash
pnpm run build
```

**Step 4: Commit**

```bash
git add apps/web/server/routes/api/media/
git commit -m "feat: add media proxy endpoint to web app"
```

---

### Task 7: Frontend — Click-to-View Lightbox

**Files:**
- Create: `apps/web/src/routes/_authenticated/-components/chat/media-lightbox.tsx`
- Modify: `apps/web/src/routes/_authenticated/-components/chat/message-bubble.tsx:111-138`

**Step 1: Create lightbox component**

Create `apps/web/src/routes/_authenticated/-components/chat/media-lightbox.tsx`:

```tsx
import { useEffect, useCallback } from 'react'

interface MediaLightboxProps {
  waMessageId: string
  mediaType: string
  onClose: () => void
}

export function MediaLightbox({ waMessageId, mediaType, onClose }: MediaLightboxProps) {
  const mediaUrl = `/api/media/${waMessageId}`

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
        onClick={onClose}
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {mediaType === 'video' ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        ) : (
          <img
            src={mediaUrl}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            alt=""
          />
        )}
      </div>
    </div>
  )
}
```

**Step 2: Update MessageBubble to open lightbox on click**

In `apps/web/src/routes/_authenticated/-components/chat/message-bubble.tsx`:

Add imports at the top:

```typescript
import { useMemo, useState } from 'react'
import { MediaLightbox } from './media-lightbox'
```

Replace the media rendering block (lines 111-138) with:

```tsx
  if (message.isMedia) {
    const mediaConfig = getMediaConfig(message.mediaType)
    const [showLightbox, setShowLightbox] = useState(false)
    const hasFullMedia = message.waMessageId && (message.mediaType === 'image' || message.mediaType === 'video' || message.mediaType === 'sticker')

    return (
      <>
        <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-1`}>
          <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
            isFromMe
              ? 'bg-coral-50 text-warm-900 rounded-br-md'
              : 'bg-warm-100 text-warm-900 rounded-bl-md'
          }`}>
            {message.thumbnail ? (
              <img
                src={`data:image/jpeg;base64,${message.thumbnail}`}
                className={`rounded-lg max-w-full ${hasFullMedia ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                alt=""
                onClick={hasFullMedia ? () => setShowLightbox(true) : undefined}
              />
            ) : hasFullMedia ? (
              <div
                className="flex items-center gap-2 py-1 cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setShowLightbox(true)}
              >
                {mediaConfig.icon}
                <span className="text-xs font-medium text-warm-500">{mediaConfig.label}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-1">
                {mediaConfig.icon}
                <span className="text-xs font-medium text-warm-500">{mediaConfig.label}</span>
              </div>
            )}
            {message.text && (
              <p className="whitespace-pre-wrap break-words mt-1">{message.text}</p>
            )}
            <span className="text-[10px] text-warm-400 mt-1 block text-right">{time}</span>
          </div>
        </div>
        {showLightbox && hasFullMedia && (
          <MediaLightbox
            waMessageId={message.waMessageId!}
            mediaType={message.mediaType!}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </>
    )
  }
```

**Important:** Move the `useState` to the top of the component (before the `useMemo`), not inside the conditional. React hooks cannot be called conditionally. The corrected approach:

```tsx
export function MessageBubble({ message }: { message: ChatMessage }) {
  const [showLightbox, setShowLightbox] = useState(false)

  const time = useMemo(() => {
    // ... existing code
  }, [message.timestamp])

  const isFromMe = message.fromMe

  if (message.isMedia) {
    const mediaConfig = getMediaConfig(message.mediaType)
    const hasFullMedia = message.waMessageId && (message.mediaType === 'image' || message.mediaType === 'video' || message.mediaType === 'sticker')

    return (
      <>
        <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-1`}>
          {/* ... media bubble content as above ... */}
        </div>
        {showLightbox && hasFullMedia && (
          <MediaLightbox
            waMessageId={message.waMessageId!}
            mediaType={message.mediaType!}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </>
    )
  }

  // ... rest of the existing non-media return
}
```

**Step 3: Build check**

```bash
pnpm run build
```

**Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/-components/chat/media-lightbox.tsx apps/web/src/routes/_authenticated/-components/chat/message-bubble.tsx
git commit -m "feat: add media lightbox for viewing full-size images and videos"
```

---

### Task 8: Build + Deploy Verification

**Step 1: Full build**

```bash
pnpm run build
```

Expected: Clean build, no TypeScript errors.

**Step 2: Start dev environment**

```bash
pnpm run dev:restart
```

**Step 3: Manual verification checklist**

- [ ] Open chat — history messages with media show thumbnails (not just icons)
- [ ] Send a new image in WhatsApp — live message appears with thumbnail in chat
- [ ] Click an image thumbnail — lightbox opens with full-resolution image
- [ ] Click a video thumbnail — lightbox opens with video player
- [ ] Press Escape or click outside — lightbox closes
- [ ] Audio/document messages still show their icon labels correctly
- [ ] Non-media messages render normally (no regression)

**Step 4: Check wa-bridge logs (Railway)**

After a media message arrives on Railway, verify the wa-bridge logs show:
```
Media stored { waMessageId: "...", size: 123456, mimeType: "image/jpeg" }
```

---

## Notes

**Size limits:** Media files over 16MB are skipped (logged but not stored). This prevents DB bloat from long videos. WhatsApp compresses images to ~1MB and limits videos to 16MB, so most media will be captured.

**Storage growth:** For a couple sending ~20 media messages/day at ~300KB average: ~6MB/day, ~180MB/month. PostgreSQL handles this fine via TOAST compression on text columns.

**Future improvements (not in this plan):**
- Migrate to S3/R2 for media storage (if DB size becomes a concern)
- Audio waveform visualization
- Document preview/download button
- Media gallery view (browse all shared media)
- Thumbnail backfill for existing messages (one-time script)
