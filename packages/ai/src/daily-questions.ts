/**
 * Static pool of daily relationship questions.
 * Rotates deterministically based on day-of-year so all users see the same question on a given day.
 */

const DAILY_QUESTIONS = [
  "What's one thing your partner did this week that made you smile?",
  "How would you rate your communication today?",
  "What's something you'd like to do together this weekend?",
  "When did you last feel really connected to your partner?",
  "What's one thing you appreciate about your partner right now?",
  "If you could plan a perfect evening together, what would it look like?",
  "How supported did you feel by your partner today?",
  "What's a small gesture your partner made recently that meant a lot?",
  "Is there something on your mind you'd like to share with your partner?",
  "What's one relationship goal you'd like to work on this week?",
  "How would you describe the energy between you two today?",
  "What's your favorite recent memory together?",
  "Is there anything you wish you had said to your partner today?",
  "How well did you listen to each other today?",
  "What's one thing that could make tomorrow better for both of you?",
  "When did your partner last surprise you in a good way?",
  "How comfortable do you feel being vulnerable with your partner right now?",
  "What's something new you learned about your partner recently?",
  "How do you feel about the balance of effort in your relationship right now?",
  "What's one way your partner shows love that you really value?",
  "If your relationship had a weather forecast today, what would it be?",
  "What's a conversation you've been meaning to have?",
  "How playful has your relationship felt lately?",
  "What's one thing you could do tomorrow to brighten your partner's day?",
  "How aligned do you feel with your partner on what matters most?",
  "What's the last compliment you gave your partner?",
  "How do you feel about the quality of time you spent together today?",
  "What's one thing you admire about how your partner handles challenges?",
  "Is there something you'd like more of in your relationship?",
  "What made you fall in love with your partner? Is that still present today?",
] as const

/**
 * Get today's daily question. Deterministic: same question for all users on the same calendar day.
 * @param dateStr - ISO date string (YYYY-MM-DD) in UTC
 */
export function getDailyQuestion(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date()
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  return DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length]
}
