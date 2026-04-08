export interface UpgradeGateDetail {
  feature: string
  limit?: number
  used?: number
  resetAt?: string
  upgradeUrl?: string
}

export const UPGRADE_EVENT = 'amore:upgrade-required'

export function isUpgradeGateDetail(value: unknown): value is UpgradeGateDetail {
  return (
    typeof value === 'object' &&
    value !== null &&
    'gated' in value &&
    (value as { gated?: unknown }).gated === true &&
    typeof (value as { feature?: unknown }).feature === 'string'
  )
}

export function openUpgradeModal(detail: UpgradeGateDetail) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent<UpgradeGateDetail>(UPGRADE_EVENT, {
      detail,
    }),
  )
}
