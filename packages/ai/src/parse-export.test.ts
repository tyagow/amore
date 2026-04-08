import { describe, expect, it } from 'vitest'

import { parseWhatsAppExport } from './parse-export'

describe('parseWhatsAppExport', () => {
  it('parses basic bracketed DD/MM/YYYY messages and extracts senders', () => {
    const result = parseWhatsAppExport(`
[07/04/2026, 09:15:00] Alice: Bom dia
[07/04/2026, 09:16:00] Bob: Oi amor
`.trim())

    expect(result.messages).toHaveLength(2)
    expect(result.messages[0]).toMatchObject({
      sender: 'Alice',
      text: 'Bom dia',
      isMedia: false,
    })
    expect(result.messages[0]?.timestamp.getFullYear()).toBe(2026)
    expect(result.messages[0]?.timestamp.getMonth()).toBe(3)
    expect(result.messages[0]?.timestamp.getDate()).toBe(7)
    expect(result.messages[0]?.timestamp.getHours()).toBe(9)
    expect(result.messages[0]?.timestamp.getMinutes()).toBe(15)
    expect(result.messages[0]?.timestamp.getSeconds()).toBe(0)
    expect(result.messages[1]).toMatchObject({
      sender: 'Bob',
      text: 'Oi amor',
      isMedia: false,
    })
    expect(result.senders).toEqual(['Alice', 'Bob'])
  })

  it('preserves multiline messages on continuation lines', () => {
    const result = parseWhatsAppExport(`
07/04/2026, 10:00 - Alice: Primeira linha
segunda linha
terceira linha
`.trim())

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0]?.text).toBe('Primeira linha\nsegunda linha\nterceira linha')
  })

  it('detects media placeholders and clears the message body', () => {
    const result = parseWhatsAppExport('[07/04/2026, 11:00:00] Bob: <Media omitted>')

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0]).toMatchObject({
      sender: 'Bob',
      text: '',
      isMedia: true,
    })
  })

  it('tracks unique senders across repeated messages', () => {
    const result = parseWhatsAppExport(`
[07/04/2026, 12:00:00] Alice: Mensagem 1
[07/04/2026, 12:01:00] Alice: Mensagem 2
[07/04/2026, 12:02:00] Bob: Mensagem 3
`.trim())

    expect(result.senders).toEqual(['Alice', 'Bob'])
  })
})
