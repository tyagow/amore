import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from 'react'
import { getWaSessionStatus } from '~/server/wa-session'
import { useChatWebSocket } from '~/hooks/use-chat-websocket'
import { useChatAI } from '~/hooks/use-chat-ai'
import { ChatHeader } from './-components/chat/chat-header'
import { MessageList } from './-components/chat/message-list'
import { ChatInput } from './-components/chat/chat-input'
import { ReviewPanel } from './-components/chat/review-panel'
import { LoggedOutOverlay } from './-components/chat/logged-out-overlay'
import { AISidebar } from './-components/chat/ai-sidebar'

export const Route = createFileRoute('/_authenticated/chat')({
  component: ChatPage,
  loader: async ({ context }) => {
    if (!context.hasCouple) throw redirect({ to: '/connect' })
    const data = await getWaSessionStatus()
    return { waSession: data.waSession }
  },
})

function ChatPage() {
  const { waSession } = Route.useLoaderData()
  const navigate = useNavigate()

  // If no WA session, redirect to setup
  if (!waSession || waSession.status !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center h-dvh -mb-20 md:mb-0 px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-warm-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-warm-900 mb-2">Connect WhatsApp First</h2>
          <p className="text-sm text-warm-500 mb-4">
            Link your WhatsApp account to start chatting with your partner.
          </p>
          <button
            onClick={() => navigate({ to: '/whatsapp' })}
            className="px-4 py-2 bg-coral-500 text-white rounded-lg text-sm font-medium hover:bg-coral-600 transition-colors"
          >
            Connect WhatsApp
          </button>
        </div>
      </div>
    )
  }

  return <ChatPageConnected />
}

function ChatPageConnected() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [showMobileAssistant, setShowMobileAssistant] = useState(false)

  const {
    messages,
    send,
    loadMore,
    connectionStatus,
    isLoading,
    hasMore,
    requestResync,
    isResyncing,
    partnerName: wsPartnerName,
  } = useChatWebSocket()

  const {
    suggestions,
    suggestionsLoading,
    mood,
    moodLoading,
    coaching,
    tensionFlag,
    aiError,
    review,
    reviewLoading,
    reviewDraft,
    clearReview,
    healthScore,
    partnerProfile,
    recentInsights,
    totalMessages,
    partnerName,
    contactJid,
  } = useChatAI(messages)

  // Redirect on session-expired
  useEffect(() => {
    if (connectionStatus === 'session-expired') {
      navigate({ to: '/whatsapp' })
    }
  }, [connectionStatus, navigate])

  const isDisconnected = connectionStatus === 'disconnected' || connectionStatus === 'reconnecting'
  const isLoggedOut = connectionStatus === 'logged-out' || connectionStatus === 'session-expired'

  const handleSend = useCallback(
    (text: string) => {
      if (!contactJid) return
      send(text, contactJid)
      clearReview()
    },
    [send, contactJid, clearReview],
  )

  const handleResync = useCallback(() => {
    requestResync()
  }, [requestResync])

  const handleReview = useCallback(
    (text: string) => {
      reviewDraft(text)
    },
    [reviewDraft],
  )

  const handleUseRevised = useCallback(() => {
    if (review?.revised) {
      setInputText(review.revised)
      clearReview()
    }
  }, [review, clearReview])

  const handleUseSuggestion = useCallback((text: string) => {
    setInputText(text)
  }, [])

  return (
    <div className="flex h-dvh -mb-20 md:mb-0 relative">
      {/* Logged out overlay */}
      {isLoggedOut && <LoggedOutOverlay />}

      {/* Chat column */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          partnerName={wsPartnerName !== 'Partner' ? wsPartnerName : partnerName}
          connectionStatus={connectionStatus}
          onResync={handleResync}
          isResyncing={isResyncing}
        />
        <div className="border-b border-warm-200 bg-warm-50 px-4 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setShowMobileAssistant((open) => !open)}
            className="flex w-full items-center justify-between rounded-xl border border-warm-200 bg-white px-3 py-2 text-left text-sm font-medium text-warm-700"
          >
            <span>AI relationship context</span>
            <span className="text-xs text-coral-600">
              {showMobileAssistant ? 'Hide' : 'Show'}
            </span>
          </button>
          {showMobileAssistant && (
            <div className="mt-2 max-h-80 overflow-y-auto rounded-2xl border border-warm-200">
              <AISidebar
                healthScore={healthScore}
                mood={mood}
                moodLoading={moodLoading}
                coaching={coaching}
                suggestions={suggestions}
                suggestionsLoading={suggestionsLoading}
                tensionFlag={tensionFlag}
                aiError={aiError}
                totalMessages={totalMessages}
                partnerName={partnerName}
                onUseSuggestion={(text) => {
                  handleUseSuggestion(text)
                  setShowMobileAssistant(false)
                }}
                partnerProfile={partnerProfile}
                recentInsights={recentInsights}
              />
            </div>
          )}
        </div>
        <MessageList
          messages={messages}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
        {review && (
          <ReviewPanel
            review={review}
            onUseRevised={handleUseRevised}
            onDismiss={clearReview}
          />
        )}
        <ChatInput
          onSend={handleSend}
          onReview={handleReview}
          disabled={isDisconnected || isLoggedOut || !contactJid}
          reviewLoading={reviewLoading}
          inputText={inputText}
          setInputText={setInputText}
        />
      </div>
      <aside className="hidden w-80 shrink-0 border-l border-warm-200 lg:block">
        <AISidebar
          healthScore={healthScore}
          mood={mood}
          moodLoading={moodLoading}
          coaching={coaching}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          tensionFlag={tensionFlag}
          aiError={aiError}
          totalMessages={totalMessages}
          partnerName={partnerName}
          onUseSuggestion={handleUseSuggestion}
          partnerProfile={partnerProfile}
          recentInsights={recentInsights}
        />
      </aside>
    </div>
  )
}
