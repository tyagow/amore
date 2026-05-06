import type { Locale } from '~/lib/i18n'

export function buildCloseLoopPracticeDraft(partnerName: string, locale: Locale = 'en') {
  const safeName = partnerName || (locale === 'pt-BR' ? 'amor' : 'love')

  if (locale === 'pt-BR') {
    return [
      `Oi ${safeName}, quero fechar o ciclo de uma coisa pequena para que nao fique vaga.`,
      '',
      'Quero tornar o seguimento visivel em vez de fazer voce adivinhar.',
      '',
      'O que eu disse que faria: ____.',
      'O que eu realmente fiz: ____.',
      'O que ainda preciso fazer ou ajustar: ____.',
      '',
      'Isso ficou visivel para voce, ou tem uma parte em que devo dar seguimento com mais clareza?',
      '',
      'Se agora nao for uma boa hora, podemos voltar nisso mais tarde hoje?',
    ].join('\n')
  }

  return [
    `Hey ${safeName}, I want to close the loop on something small so it does not stay vague.`,
    '',
    'I care about making follow-through visible instead of making you guess.',
    '',
    'What I said I would do: ____.',
    'What I actually did: ____.',
    'What I still need to do or adjust: ____.',
    '',
    'Did that feel visible to you, or is there one part I should follow through on more clearly?',
    '',
    'If now is not a good time, could we come back to it later today?',
  ].join('\n')
}
