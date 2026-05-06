#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const TARGET = path.join(ROOT, 'apps/web/src')
const ALLOWED = new Set([
  'apps/web/src/lib/chat-draft-storage.ts',
])
const findings = []

walk(TARGET, (filePath) => {
  const relative = path.relative(ROOT, filePath)
  if (ALLOWED.has(relative)) return

  const source = fs.readFileSync(filePath, 'utf8')
  const lines = source.split('\n')
  lines.forEach((line, index) => {
    if (
      /localStorage\.setItem\(\s*['"`]amore-chat-draft['"`]/.test(line) ||
      /localStorage\.setItem\(\s*['"`]amore-goal-draft['"`]/.test(line)
    ) {
      findings.push(`${relative}:${index + 1}: use storeChatDraft/storeGoalDraft so drafts keep the selected locale`)
    }
  })
})

auditChatInput()

if (findings.length) {
  process.stderr.write(`i18n draft audit findings: ${findings.length}\n`)
  process.stderr.write(`${findings.join('\n')}\n`)
  process.exit(1)
}

process.stdout.write('i18n draft audit findings: 0\n')

function auditChatInput() {
  const relative = 'apps/web/src/routes/_authenticated/-components/chat/chat-input.tsx'
  const filePath = path.join(ROOT, relative)
  if (!fs.existsSync(filePath)) return

  const source = fs.readFileSync(filePath, 'utf8')
  if (/import\s+\{\s*STARTERS\s*\}\s+from\s+['"]\.\/starter-drafts['"]/.test(source)) {
    findings.push(`${relative}: use getStarters(locale) instead of static STARTERS for localized chat chips`)
  }
  if (!/getStarters\(locale\)/.test(source)) {
    findings.push(`${relative}: chat starter chips must be built with getStarters(locale)`)
  }

  const localeSensitiveBuilders = [
    'buildRepairDraft',
    'buildNeedDraft',
    'buildAppreciationDraft',
    'buildApologyDraft',
    'buildConflictMapDraft',
    'buildSpaceDraft',
    'buildBidRepairDraft',
    'buildListenFirstDraft',
    'buildLongingDraft',
    'buildPauseBeforeSendDraft',
    'buildSofterStartDraft',
    'buildFollowUpDraft',
    'buildAftercareDraft',
    'buildDraftReadyForSend',
    'buildGoalDraftFromChatDraft',
    'buildDraftWithSpecificMoment',
    'buildDraftWithClearAsk',
    'buildDraftWithOwnership',
    'buildDraftWithWarmth',
    'buildDraftWithRoomForNo',
  ]
  const lines = source.split('\n')
  lines.forEach((line, index) => {
    if (index < 40) return
    if (/^\s*import\b/.test(line)) return
    for (const builder of localeSensitiveBuilders) {
      if (!line.includes(builder)) continue
      const window = lines.slice(index, Math.min(lines.length, index + 8)).join('\n')
      if (!window.includes('locale')) {
        findings.push(`${relative}:${index + 1}: ${builder} must receive locale before prefilling chat or goal drafts`)
      }
    }
  })
}

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.turbo', 'routeTree.gen.ts'].includes(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, onFile)
      continue
    }
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) onFile(fullPath)
  }
}
