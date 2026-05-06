import type { Locale } from '~/lib/i18n'

const SELF_HARM_PATTERN = /\b(kill myself|suicide|suicidal|hurt myself|end my life|want to die)\b/i
const VIOLENCE_PATTERN = /\b(hit me|hit you|hurt me|hurt you|threatened me|threaten me|violence|violent|unsafe|afraid of you|afraid of them|scared of you|scared of them)\b/i
const ABUSE_PATTERN = /\b(abuse|abusive|coercive|coercion|forced me|controls my|controlling me|trapped|stalking|restraining order)\b/i

export type SafetyRoutingKind = 'self_harm' | 'violence' | 'abuse'

export interface SafetyRouting {
  kind: SafetyRoutingKind
  title: string
  body: string
  draft: string
}

export function getSafetyRoutingDraft(text: string, locale: Locale = 'en'): SafetyRouting | null {
  const kind = getSafetyRoutingKind(text)
  if (!kind) return null

  if (locale === 'pt-BR') {
    return {
      kind,
      title: 'Priorize seguranca agora',
      body: 'Isso pode envolver risco, crise ou abuso. O Amore nao deve mediar essa conversa nem escrever uma mensagem de reparo para enviar agora.',
      draft: [
        'Isto parece envolver seguranca, crise ou abuso.',
        '',
        'Por favor, nao use uma conversa mediada por IA como proximo passo agora.',
        '',
        'Se alguem estiver em perigo imediato, acione os servicos de emergencia locais. Se houver risco de autoagressao, procure uma linha local de crise ou alguem de confianca agora. Se houver abuso ou medo, fale com uma pessoa segura ou um servico especializado antes de tentar reparar a conversa.',
      ].join('\n'),
    }
  }

  return {
    kind,
    title: 'Prioritize safety right now',
    body: 'This may involve danger, crisis, or abuse. Amore should not mediate this or draft a repair message to send right now.',
    draft: [
      'This looks like a safety, crisis, or abuse situation.',
      '',
      'Please do not use an AI-mediated conversation as the next step right now.',
      '',
      'If anyone is in immediate danger, contact local emergency services. If self-harm is a risk, reach a local crisis line or trusted person now. If abuse or fear is involved, talk to a safe person or specialized support before trying to repair the conversation.',
    ].join('\n'),
  }
}

function getSafetyRoutingKind(text: string): SafetyRoutingKind | null {
  if (SELF_HARM_PATTERN.test(text)) return 'self_harm'
  if (ABUSE_PATTERN.test(text)) return 'abuse'
  if (VIOLENCE_PATTERN.test(text)) return 'violence'
  return null
}
