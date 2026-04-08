import { defineEventHandler, setResponseHeaders } from 'h3'

const isProduction =
  process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT

// Build CSP directives
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' wss: https://fonts.googleapis.com https://fonts.gstatic.com",
].join('; ')

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': cspDirectives,
  })

  // HSTS only in production (requires HTTPS)
  if (isProduction) {
    setResponseHeaders(event, {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    })
  }
})
