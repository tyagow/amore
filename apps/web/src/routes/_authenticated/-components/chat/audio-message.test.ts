import { describe, expect, it } from 'vitest'
import {
  formatAudioTime,
  getAudioMediaUrl,
  isPlayableAudioMessage,
} from './audio-message'
import type { ChatMessage } from '~/types/chat'

describe('chat audio messages', () => {
  it('recognizes WhatsApp audio media with a proxied media id as playable', () => {
    const message = {
      id: 'm1',
      sender: 'Jaluza',
      text: null,
      timestamp: new Date().toISOString(),
      fromMe: false,
      isMedia: true,
      mediaType: 'audio',
      waMessageId: 'ABC123',
    } satisfies ChatMessage

    expect(isPlayableAudioMessage(message)).toBe(true)
    expect(getAudioMediaUrl(message)).toBe('/api/media/ABC123')
  })

  it('does not mark non-audio or missing-media-id messages as playable', () => {
    const base = {
      id: 'm1',
      sender: 'Jaluza',
      text: null,
      timestamp: new Date().toISOString(),
      fromMe: false,
      isMedia: true,
    } satisfies Partial<ChatMessage>

    expect(
      isPlayableAudioMessage({
        ...base,
        mediaType: 'audio',
      } as ChatMessage),
    ).toBe(false)
    expect(
      isPlayableAudioMessage({
        ...base,
        mediaType: 'image',
        waMessageId: 'ABC123',
      } as ChatMessage),
    ).toBe(false)
  })

  it('formats playback time like a chat voice note', () => {
    expect(formatAudioTime(0)).toBe('0:00')
    expect(formatAudioTime(9.4)).toBe('0:09')
    expect(formatAudioTime(75)).toBe('1:15')
    expect(formatAudioTime(Number.NaN)).toBe('0:00')
  })
})
