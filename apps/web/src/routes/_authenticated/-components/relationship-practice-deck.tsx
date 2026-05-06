import { Link } from '@tanstack/react-router'
import { buildCloseLoopPracticeDraft } from './relationship-practice-draft'
import { useI18n, type Locale } from '~/lib/i18n'
import { storeChatDraft } from '~/lib/chat-draft-storage'

const PRACTICE_DECK = [
  {
    title: '2-minute appreciation',
    body: 'Send one specific thing you noticed and valued. Specific appreciation lands better than generic praise.',
    action: 'Draft appreciation',
    draft: (partnerName: string, locale: Locale = 'en') =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, uma coisa especifica que apreciei em voce hoje foi ____. Isso me fez sentir ____ porque ____.`
        : `Hey ${partnerName}, one specific thing I appreciated about you today was ____. It made me feel ____ because ____.`,
  },
  {
    title: 'Soft check-in',
    body: 'Ask about the emotional weather before solving anything. This keeps the conversation safe.',
    action: 'Draft check-in',
    draft: (partnerName: string, locale: Locale = 'en') =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, como voce esta se sentindo sobre nos hoje? Nao preciso de uma resposta perfeita. So quero te entender melhor.`
        : `Hey ${partnerName}, how are you feeling about us today? I do not need a perfect answer. I just want to understand you better.`,
  },
  {
    title: 'Repair after tension',
    body: 'Use when something feels unresolved. It opens the door without blaming either person.',
    action: 'Draft repair',
    draft: (partnerName: string, locale: Locale = 'en') =>
      locale === 'pt-BR'
        ? `Oi ${partnerName}, sinto que talvez ainda tenha algo parado entre nos. Eu me importo mais com a gente do que com estar certo. Podemos tirar 10 minutos para entender um ao outro?`
        : `Hey ${partnerName}, I feel like something may still be sitting between us. I care about us more than being right. Can we take 10 minutes to understand each other?`,
  },
  {
    title: 'Close the loop',
    body: 'Use after a promise, repair, or plan so your partner does not have to guess whether follow-through happened.',
    action: 'Draft follow-through',
    draft: buildCloseLoopPracticeDraft,
  },
]

export function RelationshipPracticeDeck({ partnerName }: { partnerName: string }) {
  const { locale, t } = useI18n()
  return (
    <section className="rounded-3xl bg-warm-100 p-5 shadow-[0_1px_3px_rgba(42,33,24,0.04),0_4px_12px_rgba(42,33,24,0.02)]">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">
            {t('Practice, not theory')}
          </p>
          <h2 className="font-display text-2xl text-warm-900">{t('Tiny things that help today')}</h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-warm-500">
          {t('These are deliberately small. The point is to make care easy to repeat.')}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {PRACTICE_DECK.map((practice) => (
          <div key={practice.title} className="rounded-2xl border border-warm-200 bg-white/70 p-4">
            <h3 className="text-sm font-semibold text-warm-900">{t(practice.title)}</h3>
            <p className="mt-2 min-h-16 text-sm leading-relaxed text-warm-500">{t(practice.body)}</p>
            <Link
              to="/chat"
              onClick={() => {
                storeChatDraft(practice.draft(partnerName, locale), locale)
              }}
              className="mt-4 inline-flex rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm font-semibold text-warm-700 transition-colors hover:border-coral-200 hover:bg-coral-50 hover:text-coral-700"
            >
              {t(practice.action)}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
