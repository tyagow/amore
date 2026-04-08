import {
  defineEventHandler,
  getRequestHeader,
  setResponseHeaders,
  isPreflightRequest,
  sendNoContent,
} from 'h3'

const isProduction =
  process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT

function getAllowedOrigins(): string[] {
  const origins: string[] = []

  if (process.env.WEB_APP_URL) {
    origins.push(process.env.WEB_APP_URL)
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    origins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`)
  }

  return origins
}

export default defineEventHandler((event) => {
  // Only enforce CORS in production — allow everything in dev
  if (!isProduction) return

  const origin = getRequestHeader(event, 'origin')
  if (!origin) return

  const allowedOrigins = getAllowedOrigins()

  if (allowedOrigins.includes(origin)) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    })
  }

  if (isPreflightRequest(event)) {
    return sendNoContent(event)
  }
})
