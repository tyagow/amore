import type { AILocale } from './locale'

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

const DAILY_QUESTIONS_PT_BR = [
  'Qual foi uma coisa que sua parceria fez esta semana que te fez sorrir?',
  'Como voce avaliaria a comunicacao de voces hoje?',
  'O que voce gostaria de fazerem juntos neste fim de semana?',
  'Quando foi a ultima vez que voce se sentiu realmente conectado com sua parceria?',
  'O que voce aprecia na sua parceria agora?',
  'Se voce pudesse planejar uma noite perfeita juntos, como ela seria?',
  'Quanto apoio voce sentiu da sua parceria hoje?',
  'Qual pequeno gesto recente da sua parceria significou muito para voce?',
  'Existe algo na sua mente que voce gostaria de compartilhar com sua parceria?',
  'Qual meta de relacionamento voce gostaria de praticar esta semana?',
  'Como voce descreveria a energia entre voces dois hoje?',
  'Qual e sua lembranca recente favorita juntos?',
  'Existe algo que voce gostaria de ter dito para sua parceria hoje?',
  'Quao bem voces se escutaram hoje?',
  'O que poderia tornar amanha melhor para voces dois?',
  'Quando foi a ultima vez que sua parceria te surpreendeu de um jeito bom?',
  'Quao confortavel voce se sente em ser vulneravel com sua parceria agora?',
  'O que voce aprendeu recentemente sobre sua parceria?',
  'Como voce se sente sobre o equilibrio de esforco no relacionamento agora?',
  'Qual forma de amor da sua parceria voce mais valoriza?',
  'Se o relacionamento tivesse uma previsao do tempo hoje, qual seria?',
  'Qual conversa voces estao adiando?',
  'Quao leve e brincalhao o relacionamento tem parecido ultimamente?',
  'O que voce poderia fazer amanha para iluminar o dia da sua parceria?',
  'Quao alinhado voce se sente com sua parceria sobre o que mais importa?',
  'Qual foi o ultimo elogio que voce deu para sua parceria?',
  'Como voce se sente sobre a qualidade do tempo que passaram juntos hoje?',
  'O que voce admira em como sua parceria lida com desafios?',
  'Existe algo que voce gostaria de ter mais no relacionamento?',
  'O que fez voce se apaixonar pela sua parceria? Isso ainda esta presente hoje?',
] as const

/**
 * Get today's daily question. Deterministic: same question for all users on the same calendar day.
 * @param dateStr - ISO date string (YYYY-MM-DD) in UTC
 */
export function getDailyQuestion(dateStr?: string, locale: AILocale = 'en'): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date()
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  const questions = locale === 'pt-BR' ? DAILY_QUESTIONS_PT_BR : DAILY_QUESTIONS
  return questions[dayOfYear % questions.length]
}
