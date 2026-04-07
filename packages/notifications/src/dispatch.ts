import { db } from '@amore-couples/db'
import { notificationPreferences } from '@amore-couples/db/schema'
import { eq } from 'drizzle-orm'
import { sendWebPush, type PushPayload } from './channels/web-push'

// ── Notification Types ──────────────────────────────────

export type NotificationType =
  | 'mood_alert'
  | 'mood_detection'
  | 'score_drop'
  | 'conflict_alert'
  | 'milestone'
  | 'goal_completed'
  | 'coaching_tip'
  | 'connection_accepted'
  | 'analysis_complete'

export interface NotificationRequest {
  type: NotificationType
  title: string
  body: string
  url?: string
  coupleId?: string
  sourceId?: string
}

// ── Preference Type → DB Column Mapping ─────────────────

const TYPE_TO_PREF: Record<NotificationType, string | null> = {
  mood_alert: 'moodAlerts',
  mood_detection: 'moodAlerts',
  score_drop: 'scoreDrops',
  conflict_alert: 'coachNudges',
  milestone: 'milestones',
  goal_completed: 'goalUpdates',
  coaching_tip: 'coachNudges',
  connection_accepted: null, // always send
  analysis_complete: null, // always send
}

// ── Quiet Hours Check ───────────────────────────────────

function isInQuietHours(prefs: {
  quietStart: string | null
  quietEnd: string | null
  timezone: string | null
}): boolean {
  if (!prefs.quietStart || !prefs.quietEnd || !prefs.timezone) return false

  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: prefs.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const currentTime = formatter.format(now) // "HH:MM"

    const start = prefs.quietStart
    const end = prefs.quietEnd

    if (start <= end) {
      // Same day: e.g. 22:00–23:00
      return currentTime >= start && currentTime < end
    } else {
      // Crosses midnight: e.g. 22:00–07:00
      return currentTime >= start || currentTime < end
    }
  } catch {
    return false
  }
}

// ── Main Dispatch Function ──────────────────────────────

/**
 * Send a notification to a user via all available channels.
 * Checks user preferences and quiet hours before dispatching.
 * Works without a request context (safe to call from wa-bridge).
 */
export async function sendNotification(
  userId: string,
  notification: NotificationRequest,
): Promise<void> {
  // Check user preferences
  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  })

  if (prefs) {
    // Check if push is globally disabled
    if (!prefs.pushEnabled) return

    // Check per-type preference
    const prefKey = TYPE_TO_PREF[notification.type]
    if (prefKey && !(prefs as Record<string, unknown>)[prefKey]) return

    // Check quiet hours
    if (isInQuietHours(prefs)) return
  }

  const payload: PushPayload = {
    title: notification.title,
    body: notification.body,
    icon: '/pwa-icon-192x192.png',
    badge: '/favicon-32x32.png',
    url: notification.url ?? '/dashboard',
    tag: `${notification.type}-${notification.sourceId ?? Date.now()}`,
  }

  try {
    await sendWebPush(userId, payload, {
      coupleId: notification.coupleId,
      type: notification.type,
      sourceId: notification.sourceId,
    })
  } catch (err) {
    console.error(`[notifications] Failed to dispatch ${notification.type} to ${userId}:`, err)
  }
}

// ── Helpers for Common Notifications ────────────────────

/**
 * Notify partner about a mood alert.
 */
export async function notifyMoodAlert(
  partnerId: string,
  senderName: string,
  mood: string,
  note: string | null,
  opts: { coupleId: string; sourceId: string },
): Promise<void> {
  const moodEmoji: Record<string, string> = {
    great: '\u{1F60A}',
    good: '\u{1F642}',
    neutral: '\u{1F610}',
    low: '\u{1F614}',
    struggling: '\u{1F622}',
  }

  const emoji = moodEmoji[mood] ?? ''
  const body = note
    ? `${senderName} is feeling ${mood} ${emoji} — "${note}"`
    : `${senderName} is feeling ${mood} ${emoji}`

  await sendNotification(partnerId, {
    type: 'mood_alert',
    title: 'Partner Mood Alert',
    body,
    url: '/dashboard',
    coupleId: opts.coupleId,
    sourceId: opts.sourceId,
  })
}

/**
 * Notify partner about a completed goal.
 */
export async function notifyGoalCompleted(
  partnerId: string,
  completedByName: string,
  goalTitle: string,
  opts: { coupleId: string; sourceId: string },
): Promise<void> {
  await sendNotification(partnerId, {
    type: 'goal_completed',
    title: 'Goal Completed!',
    body: `${completedByName} completed: ${goalTitle}`,
    url: '/dashboard',
    coupleId: opts.coupleId,
    sourceId: opts.sourceId,
  })
}

/**
 * Notify the requester that their connection was accepted.
 */
export async function notifyConnectionAccepted(
  requesterId: string,
  acceptedByName: string,
  opts: { sourceId: string },
): Promise<void> {
  await sendNotification(requesterId, {
    type: 'connection_accepted',
    title: 'Connection Accepted!',
    body: `${acceptedByName} accepted your connection! Set up WhatsApp to start.`,
    url: '/dashboard',
    sourceId: opts.sourceId,
  })
}

/**
 * Notify user about analysis completion.
 */
export async function notifyAnalysisComplete(
  userId: string,
  healthScore: number,
  opts: { coupleId: string },
): Promise<void> {
  await sendNotification(userId, {
    type: 'analysis_complete',
    title: 'Analysis Ready!',
    body: `Your relationship analysis is ready. Health score: ${healthScore}/100`,
    url: '/dashboard',
    coupleId: opts.coupleId,
  })
}
