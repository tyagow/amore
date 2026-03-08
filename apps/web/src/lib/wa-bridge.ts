const WA_BRIDGE_URL = process.env.WA_BRIDGE_URL || 'http://localhost:9945'
const WA_BRIDGE_SECRET = process.env.WA_BRIDGE_SECRET || ''

async function bridgeFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${WA_BRIDGE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WA_BRIDGE_SECRET}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `Bridge request failed: ${res.status}`)
  }

  return res.json()
}

export async function createBridgeSession(sessionId: string): Promise<{ status: string }> {
  return bridgeFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export async function getBridgeSession(sessionId: string): Promise<{ status: string; qr?: string; messageCount?: number }> {
  return bridgeFetch(`/sessions/${encodeURIComponent(sessionId)}`)
}

export async function deleteBridgeSession(sessionId: string): Promise<{ status: string }> {
  return bridgeFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  })
}

export interface WaContact {
  jid: string
  name?: string
  pushName?: string
  phone: string
  conversationTimestamp?: number
}

export async function getBridgeContacts(sessionId: string): Promise<{ contacts: WaContact[] }> {
  return bridgeFetch(`/sessions/${encodeURIComponent(sessionId)}/contacts`)
}

export async function setBridgeContact(
  sessionId: string,
  contactJid: string,
  coupleId: string,
  partnerUserId: string,
): Promise<{ status: string }> {
  return bridgeFetch(`/sessions/${encodeURIComponent(sessionId)}/contact`, {
    method: 'POST',
    body: JSON.stringify({ contactJid, coupleId, partnerUserId }),
  })
}

export async function sendBridgeMessage(
  sessionId: string,
  jid: string,
  text: string,
): Promise<{ id: string; timestamp: number }> {
  return bridgeFetch(`/sessions/${encodeURIComponent(sessionId)}/send`, {
    method: 'POST',
    body: JSON.stringify({ jid, text }),
  })
}

export async function triggerBridgeAnalysis(
  coupleId: string,
): Promise<{ status: string }> {
  return bridgeFetch(`/analysis/${encodeURIComponent(coupleId)}`, {
    method: 'POST',
  })
}
