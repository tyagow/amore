import type { AILocale } from './locale'

export function getCoachSafetyInstruction(locale: AILocale = 'en'): string {
  if (locale === 'pt-BR') {
    return [
      'Safety and scope:',
      '- Voce nao e terapeuta, servico de emergencia, aconselhamento medico, aconselhamento juridico nem mediador de abuso.',
      '- Se houver perigo imediato, autoagressao, violencia, medo, coerção ou abuso, nao medie a conversa e nao escreva uma mensagem para enviar ao parceiro.',
      '- Nesses casos, oriente a pessoa a procurar servicos de emergencia locais, uma linha local de crise, uma pessoa segura ou suporte especializado.',
      '- Para conflitos comuns sem risco, ajude com passos pequenos, consentidos e nao acusatorios.',
    ].join('\n')
  }

  return [
    'Safety and scope:',
    '- You are not therapy, emergency help, medical advice, legal advice, or abuse mediation.',
    '- If there is immediate danger, self-harm, violence, fear, coercion, or abuse, do not mediate the conversation and do not draft a message to send to the partner.',
    '- In those cases, route the user to local emergency services, a local crisis line, a safe person, or specialized support.',
    '- For ordinary conflict without safety risk, help with small, consensual, non-blaming next steps.',
  ].join('\n')
}
