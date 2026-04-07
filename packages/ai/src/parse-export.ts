/**
 * WhatsApp .txt chat export parser.
 *
 * Handles formats:
 *   [DD/MM/YYYY, HH:MM:SS] Sender: Message
 *   [MM/DD/YYYY, HH:MM:SS] Sender: Message
 *   DD/MM/YYYY, HH:MM - Sender: Message (no brackets, Android)
 *   [DD/MM/YYYY, HH:MM:SS AM/PM] Sender: Message (12h)
 *
 * Multi-line messages: continuation lines without a timestamp prefix are
 * appended to the previous message.
 *
 * System messages (encryption notices, group description changes, etc.)
 * are skipped.
 */

export interface ParsedMessage {
  timestamp: Date
  sender: string
  text: string
  isMedia: boolean
}

export interface ParseResult {
  messages: ParsedMessage[]
  senders: string[]
  dateRange: { start: Date; end: Date } | null
  skippedLines: number
}

// Patterns for the timestamp + sender prefix
// [DD/MM/YYYY, HH:MM:SS] or [MM/DD/YYYY, HH:MM:SS] or [DD/MM/YYYY, HH:MM:SS AM]
const BRACKET_RE =
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s+(.+?):\s([\s\S]*)$/

// DD/MM/YYYY, HH:MM - Sender: Message (Android without brackets)
const ANDROID_RE =
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+-\s+(.+?):\s([\s\S]*)$/

// System message patterns to skip
const SYSTEM_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /changed the (subject|group description|group icon|group settings)/i,
  /created group/i,
  /added you/i,
  /joined using this group/i,
  /left$/i,
  /removed /i,
  /changed their phone number/i,
  /your security code with .+ changed/i,
  /this message was deleted/i,
  /you deleted this message/i,
  /disappeared/i,
]

// Media placeholder patterns
const MEDIA_PATTERNS = [
  /<media omitted>/i,
  /<image omitted>/i,
  /<video omitted>/i,
  /<audio omitted>/i,
  /<sticker omitted>/i,
  /<document omitted>/i,
  /<contact card omitted>/i,
  /<attached:\s*.+>/i,
  /^[\u200E\u200F]*$/,  // direction marks only
]

function isSystemMessage(line: string): boolean {
  return SYSTEM_PATTERNS.some((re) => re.test(line))
}

function isMediaPlaceholder(text: string): boolean {
  return MEDIA_PATTERNS.some((re) => re.test(text.trim()))
}

/**
 * Parse a date string from the export.
 * Tries DD/MM/YYYY first, falls back to MM/DD/YYYY if month > 12.
 */
function parseDate(dateStr: string, timeStr: string): Date | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null

  let [a, b, yearStr] = parts
  let year = Number(yearStr)
  if (year < 100) year += 2000

  const aNum = Number(a)
  const bNum = Number(b)

  let day: number
  let month: number

  if (aNum > 12) {
    // Must be DD/MM
    day = aNum
    month = bNum
  } else if (bNum > 12) {
    // Must be MM/DD
    month = aNum
    day = bNum
  } else {
    // Ambiguous — default to DD/MM (most common internationally)
    day = aNum
    month = bNum
  }

  // Parse time
  let timePart = timeStr.trim()
  let isPM = false
  let isAM = false

  if (/[Pp][Mm]/.test(timePart)) {
    isPM = true
    timePart = timePart.replace(/\s*[Pp][Mm]/i, '')
  } else if (/[Aa][Mm]/.test(timePart)) {
    isAM = true
    timePart = timePart.replace(/\s*[Aa][Mm]/i, '')
  }

  const timeParts = timePart.split(':').map(Number)
  let hour = timeParts[0] ?? 0
  const minute = timeParts[1] ?? 0
  const second = timeParts[2] ?? 0

  if (isPM && hour < 12) hour += 12
  if (isAM && hour === 12) hour = 0

  const date = new Date(year, month - 1, day, hour, minute, second)
  if (Number.isNaN(date.getTime())) return null

  return date
}

/**
 * Strip the BOM and normalize line endings.
 */
function normalizeText(raw: string): string {
  // Remove BOM (UTF-8 and UTF-16)
  let text = raw.replace(/^\uFEFF/, '')
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  // Remove invisible RTL/LTR marks at line starts
  text = text.replace(/^[\u200E\u200F]+/gm, '')
  return text
}

export function parseWhatsAppExport(raw: string): ParseResult {
  const text = normalizeText(raw)
  const lines = text.split('\n')

  const messages: ParsedMessage[] = []
  const senderSet = new Set<string>()
  let skippedLines = 0
  let currentMessage: ParsedMessage | null = null

  for (const line of lines) {
    if (!line.trim()) continue

    // Try bracket format first, then Android format
    const match = BRACKET_RE.exec(line) ?? ANDROID_RE.exec(line)

    if (match) {
      // Flush previous message
      if (currentMessage) {
        messages.push(currentMessage)
      }

      const [, dateStr, timeStr, sender, content] = match
      const timestamp = parseDate(dateStr, timeStr)

      if (!timestamp) {
        skippedLines++
        currentMessage = null
        continue
      }

      // Check for system messages (no colon sender or system content)
      if (isSystemMessage(content)) {
        skippedLines++
        currentMessage = null
        continue
      }

      const isMedia = isMediaPlaceholder(content)
      senderSet.add(sender)

      currentMessage = {
        timestamp,
        sender,
        text: isMedia ? '' : content.trim(),
        isMedia,
      }
    } else if (currentMessage) {
      // Continuation line — append to current message
      currentMessage.text += '\n' + line
    } else {
      // Unrecognized line outside a message
      skippedLines++
    }
  }

  // Flush last message
  if (currentMessage) {
    messages.push(currentMessage)
  }

  const senders = Array.from(senderSet)

  const dateRange = messages.length > 0
    ? {
        start: messages[0].timestamp,
        end: messages[messages.length - 1].timestamp,
      }
    : null

  return { messages, senders, dateRange, skippedLines }
}
