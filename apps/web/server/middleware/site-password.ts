import { defineEventHandler, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3'

function decodeBasicAuth(value: string): string {
  return atob(value)
}

export default defineEventHandler((event) => {
  const password = process.env.SITE_PASSWORD
  if (!password) return

  const auth = getRequestHeader(event, 'authorization')
  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = decodeBasicAuth(encoded)
      const [, pwd] = decoded.split(':')
      if (pwd === password) return
    }
  }

  setResponseStatus(event, 401)
  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Amore"')
  return 'Unauthorized'
})
