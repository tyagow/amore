import pino from 'pino'

export const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  redact: {
    paths: ['*.jid', '*.contactJid', '*.remoteJid'],
    censor: (value: string) => {
      if (typeof value !== 'string') return value
      // Redact phone number portion of JID: 5511999999999@s.whatsapp.net → 55119***@s.whatsapp.net
      const atIdx = value.indexOf('@')
      if (atIdx > 5) return value.slice(0, 5) + '***' + value.slice(atIdx)
      return '***'
    },
  },
})
