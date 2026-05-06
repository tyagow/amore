import { Link, useNavigate } from '@tanstack/react-router'
import { signOut } from '~/lib/auth-client'
import { useI18n, type Locale } from '~/lib/i18n'

interface NavProps {
  partnerMoodColor?: string | null
  pendingRequestCount?: number
  coachOpen?: boolean
  hasNudges?: boolean
  onCoachToggle?: () => void
}

export function Nav({
  partnerMoodColor,
  pendingRequestCount,
  coachOpen = false,
  hasNudges = false,
  onCoachToggle,
}: NavProps) {
  const navigate = useNavigate()
  const { locale, setLocale, t } = useI18n()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-warm-50/80 backdrop-blur-lg border-t border-warm-200 md:hidden pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          <NavItem
            to="/dashboard"
            label={t('Home')}
            moodDot={partnerMoodColor}
            search={dashboardSearch}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </NavItem>
          <NavItem to="/insights" label={t('Insights')}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </NavItem>
          <NavItem to="/goals" label={t('Goals')}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavItem>
          <NavItem to="/chat" label={t('Chat')}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </NavItem>
          <NavItem to="/whatsapp" label={t('WhatsApp')}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </NavItem>
          <NavItem to="/profile" label={t('Profile')}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </NavItem>
          {onCoachToggle && (
            <NavButtonItem
              label={t('Coach')}
              active={coachOpen}
              onClick={onCoachToggle}
              hasNudges={hasNudges}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.674M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.37 3.37 0 0 0 14 18.47V19a2 2 0 1 1-4 0v-.53c0-.895-.356-1.755-.988-2.387l-.547-.547Z" />
              </svg>
            </NavButtonItem>
          )}
          {pendingRequestCount != null && pendingRequestCount > 0 && (
            <NavItem to="/connect" label={t('Connect')}>
              <span className="relative">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {pendingRequestCount}
                </span>
              </span>
            </NavItem>
          )}
        </div>
      </nav>

      {/* Desktop sidebar nav */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-64 flex-col bg-warm-50 border-r border-warm-200">
        <div className="px-6 py-6">
          <Link
            to="/dashboard"
            search={dashboardSearch}
            className="text-2xl font-display italic text-coral-500 tracking-tight"
          >
            Amore
          </Link>
        </div>

        <div className="flex-1 px-3 space-y-1">
          <SidebarItem
            to="/dashboard"
            label={t('Dashboard')}
            moodDot={partnerMoodColor}
            search={dashboardSearch}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </SidebarItem>
          <SidebarItem to="/insights" label={t('Insights')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </SidebarItem>
          <SidebarItem to="/goals" label={t('Goals')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </SidebarItem>
          <SidebarItem to="/chat" label={t('Chat')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </SidebarItem>
          <SidebarItem to="/whatsapp" label={t('WhatsApp')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </SidebarItem>
          <SidebarItem to="/profile" label={t('Profile')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </SidebarItem>
          {pendingRequestCount != null && pendingRequestCount > 0 && (
            <SidebarItem to="/connect" label={t('Connection Requests')}>
              <span className="relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {pendingRequestCount}
                </span>
              </span>
            </SidebarItem>
          )}
        </div>

        <div className="px-3 py-4 border-t border-warm-200">
          {onCoachToggle && (
            <SidebarButtonItem
              label={t('Coach')}
              active={coachOpen}
              onClick={onCoachToggle}
              hasNudges={hasNudges}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.674M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.37 3.37 0 0 0 14 18.47V19a2 2 0 1 1-4 0v-.53c0-.895-.356-1.755-.988-2.387l-.547-.547Z" />
              </svg>
            </SidebarButtonItem>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:bg-warm-100 hover:text-warm-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {t('Sign Out')}
          </button>
          <LanguageSwitcher locale={locale} setLocale={setLocale} />
        </div>
      </nav>
    </>
  )
}

const dashboardSearch = { upgraded: false }

// ── Mobile nav item ──────────────────────────────────────

function NavItem({
  to,
  label,
  children,
  moodDot,
  search,
}: {
  to: string
  label: string
  children: React.ReactNode
  moodDot?: string | null
  search?: Record<string, unknown>
}) {
  return (
    <Link
      to={to}
      search={search}
      className="relative flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-warm-400 transition-colors"
      activeProps={{ className: 'text-coral-500 border-t-2 border-coral-500 -mt-[2px]' }}
    >
      <span className="relative">
        {children}
        {moodDot && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: moodDot }}
          />
        )}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

function NavButtonItem({
  label,
  children,
  active,
  hasNudges,
  onClick,
}: {
  label: string
  children: React.ReactNode
  active?: boolean
  hasNudges?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg transition-colors ${
        active
          ? 'text-coral-500 border-t-2 border-coral-500 -mt-[2px]'
          : 'text-warm-400'
      }`}
    >
      <span className="relative">
        {children}
        {hasNudges && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

// ── Desktop sidebar item ─────────────────────────────────

function SidebarItem({
  to,
  label,
  children,
  moodDot,
  search,
}: {
  to: string
  label: string
  children: React.ReactNode
  moodDot?: string | null
  search?: Record<string, unknown>
}) {
  return (
    <Link
      to={to}
      search={search}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-500 hover:bg-warm-100 hover:text-warm-800 transition-colors"
      activeProps={{ className: 'border-l-[3px] border-coral-500 bg-coral-50 text-coral-600 rounded-r-lg' }}
    >
      <span className="relative">
        {children}
        {moodDot && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: moodDot }}
          />
        )}
      </span>
      {label}
    </Link>
  )
}

function SidebarButtonItem({
  label,
  children,
  active,
  hasNudges,
  onClick,
}: {
  label: string
  children: React.ReactNode
  active?: boolean
  hasNudges?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-l-[3px] border-coral-500 bg-coral-50 text-coral-600 rounded-r-lg'
          : 'rounded-lg text-warm-500 hover:bg-warm-100 hover:text-warm-800'
      }`}
    >
      <span className="relative">
        {children}
        {hasNudges && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </span>
      {label}
    </button>
  )
}

function LanguageSwitcher({
  locale,
  setLocale,
}: {
  locale: Locale
  setLocale: (locale: Locale) => void
}) {
  return (
    <div className="mt-2 flex items-center gap-1 px-3 text-[11px] font-semibold text-warm-400">
      {(['en', 'pt-BR'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          className={`rounded-full px-1.5 py-0.5 transition-colors ${
            locale === option
              ? 'text-warm-800'
              : 'hover:text-warm-700'
          }`}
          aria-pressed={locale === option}
          aria-label={option === 'en' ? 'English' : 'Portugues'}
        >
          {option === 'en' ? 'EN' : 'PT'}
        </button>
      ))}
    </div>
  )
}
