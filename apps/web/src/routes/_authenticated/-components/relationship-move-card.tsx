import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useI18n } from '~/lib/i18n'
import { storeChatDraft } from '~/lib/chat-draft-storage'
import type { PersonalizedRitual } from './personalized-ritual-engine'

export function RelationshipMoveCard({
  partnerName,
  healthScore,
  messagesSinceAnalysis,
  hasGoals,
  partnerMoodSet,
  ritual,
  onOpenCoach,
}: {
  partnerName: string
  healthScore: number | null
  messagesSinceAnalysis: number | null
  hasGoals: boolean
  partnerMoodSet: boolean
  ritual?: PersonalizedRitual
  onOpenCoach: (prompt?: string) => void
}) {
  const { locale, t } = useI18n()
  const [showGuide, setShowGuide] = useState(false)
  const score = healthScore ?? 0
  const needsRepair = healthScore !== null && score < 70
  const needsFreshAnalysis = !!messagesSinceAnalysis && messagesSinceAnalysis >= 20
  const selectedRitual = needsRepair ? null : ritual
  const repairDraft = buildRelationshipRepairDraft(partnerName, locale)
  const coachPrompt = selectedRitual
    ? selectedRitual.coachPrompt(partnerName)
    : needsRepair
      ? `Help me prepare a 10-minute repair conversation with ${partnerName}. I want to start with appreciation, own my part, and ask what felt heavy without sounding defensive.`
      : !partnerMoodSet
        ? `Help me invite ${partnerName} into a soft daily check-in that feels caring, not demanding.`
        : !hasGoals
          ? 'Help me choose one tiny relationship goal for this week that we can actually keep.'
          : `Help me write one specific caring message to ${partnerName} today.`

  const move = needsRepair
    ? {
        label: 'Today\'s relationship move',
        title: 'Have the 10-minute repair conversation',
        body:
          locale === 'pt-BR'
            ? `Sua ultima pontuacao mostra espaco para crescer. Comece com uma coisa especifica que voce aprecia em ${partnerName}, depois pergunte o que ficou pesado esta semana.`
            : `Your latest score shows there is room for growth. Start with one specific thing you appreciate about ${partnerName}, then ask what felt heavy this week.`,
        primary: 'Ask coach how',
        secondary: 'Start repair guide',
      }
    : selectedRitual
      ? {
          label: 'Today\'s relationship move',
          title: selectedRitual.title,
          body: selectedRitual.body,
          primary: 'Coach me through it',
          secondary: selectedRitual.actionLabel,
        }
    : !partnerMoodSet
      ? {
          label: 'Today\'s relationship move',
          title: `Invite ${partnerName} into a quick check-in`,
          body: 'The fastest way to make the app feel shared is a tiny daily ritual. Ask how they are feeling before trying to solve anything.',
          primary: 'Draft with coach',
          secondary: 'Open chat',
        }
      : !hasGoals
        ? {
            label: 'Today\'s relationship move',
            title: 'Choose one small goal for this week',
            body: 'Turn the insight into a visible commitment. Keep it tiny enough that both of you can actually do it.',
            primary: 'Ask coach for ideas',
            secondary: 'Create goal',
          }
        : {
            label: 'Today\'s relationship move',
            title: 'Do one caring thing on purpose',
            body: `Send ${partnerName} one message that is specific, warm, and easy to receive. Small consistency beats big plans.`,
            primary: 'Polish with coach',
            secondary: 'Open chat',
          }

  return (
    <section className="overflow-hidden rounded-3xl border border-coral-200 bg-coral-50 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_10px_30px_rgba(201,107,79,0.10)]">
      <div className="grid gap-0 md:grid-cols-[1fr_auto]">
        <div className="p-6 md:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-600">
            {t(move.label)}
          </p>
          <h2 className="mt-2 font-display text-2xl text-warm-900">
            {t(move.title)}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-600">
            {t(move.body)}
          </p>
          {needsFreshAnalysis && (
            <p className="mt-3 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-coral-700">
              {locale === 'pt-BR'
                ? `${messagesSinceAnalysis} novas mensagens estao esperando para serem entendidas.`
                : `${messagesSinceAnalysis} new messages are waiting to be understood.`}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-coral-100 bg-white/55 p-4 md:w-48 md:border-l md:border-t-0">
          <button
            type="button"
            onClick={needsRepair ? () => setShowGuide((open) => !open) : () => onOpenCoach(coachPrompt)}
            className="rounded-xl bg-coral-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-600"
          >
            {needsRepair ? (showGuide ? t('Hide guide') : t(move.secondary)) : t(move.primary)}
          </button>
          {needsRepair ? (
            <button
              type="button"
              onClick={() => onOpenCoach(coachPrompt)}
              className="rounded-xl border border-coral-200 bg-white px-4 py-3 text-sm font-semibold text-coral-700 transition-colors hover:bg-coral-50"
            >
              {t('Ask coach how')}
            </button>
          ) : (
            <Link
              to={move.secondary === 'Create goal' ? '/goals' : '/chat'}
              onClick={() => {
                if (selectedRitual) {
                  storeChatDraft(selectedRitual.chatDraft(partnerName, locale), locale)
                }
              }}
              className="rounded-xl border border-coral-200 bg-white px-4 py-3 text-center text-sm font-semibold text-coral-700 transition-colors hover:bg-coral-50"
            >
              {t(move.secondary)}
            </Link>
          )}
        </div>
      </div>
      {showGuide && (
        <div className="border-t border-coral-100 bg-white/70 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-warm-900">{t('10-minute repair guide')}</p>
              <ol className="mt-3 space-y-3 text-sm leading-relaxed text-warm-600">
                <li><span className="font-semibold text-warm-800">{t('1. Appreciate first.')}</span> {t('Name one real thing before naming the problem.')}</li>
                <li><span className="font-semibold text-warm-800">{t('2. Own your part.')}</span> {t('Keep it short. No courtroom case.')}</li>
                <li><span className="font-semibold text-warm-800">{t('3. Ask to understand.')}</span> {t('Invite their experience before proposing a fix.')}</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-warm-200 bg-warm-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-warm-500">{t('Ready-to-edit draft')}</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-warm-800">{repairDraft}</p>
              <Link
                to="/chat"
                onClick={() => {
                  storeChatDraft(repairDraft, locale)
                }}
                className="mt-4 inline-flex rounded-xl bg-warm-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-warm-800"
              >
                {t('Use this in chat')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export function buildRelationshipRepairDraft(partnerName: string, locale = 'en') {
  if (locale === 'pt-BR') {
    const safeName = partnerName || 'sua parceria'
    return `Oi ${safeName}, quero reparar algo em vez de deixar isso parado entre a gente.\n\nEu me importo em fazer essa conversa parecer mais segura, nao em provar quem estava certo.\n\nUma coisa que eu aprecio em voce e ____.\n\nUma parte que posso assumir e ____.\n\nPodemos separar 10 minutos hoje para falar do que ficou pesado para voce e que reparo realmente ajudaria?\n\nSe agora nao for um bom momento, podemos escolher um momento menor mais tarde hoje?`
  }

  return `Hey ${partnerName}, I want to repair something instead of letting it sit between us.\n\nI care about making this conversation feel safer, not proving who was right.\n\nOne thing I appreciate about you is ____.\n\nOne part I can own is ____.\n\nCould we take 10 minutes today to talk about what felt heavy for you and what repair would actually help?\n\nIf now is not a good time, could we choose a smaller moment later today?`
}
