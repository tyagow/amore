export const PARTNER_INVITE_UNLOCKS = [
  'Live insights from both sides',
  'Shared goals and follow-through',
  'Rituals you can both complete',
  'Mood sync without guessing',
] as const

export type ConnectionDisplayMode = 'connected' | 'solo-value' | 'new-user'

export function getConnectionDisplayMode(status: string | null | undefined): ConnectionDisplayMode {
  if (status === 'active') return 'connected'
  if (status === 'solo') return 'solo-value'
  return 'new-user'
}

export function buildPartnerInvitePrivacyNote(hasPrivateImport: boolean): string {
  if (!hasPrivateImport) {
    return 'Your partner only sees what you explicitly share after they accept.'
  }

  return 'Your private import preview and private coach history are not shared by default. Inviting your partner unlocks shared tools; it does not expose private solo work unless you explicitly choose to share it.'
}
