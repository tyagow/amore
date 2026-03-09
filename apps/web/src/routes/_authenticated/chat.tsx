import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from 'react'
import { getWaSessionStatus } from '~/server/wa-session'
import { useChatWebSocket } from '~/hooks/use-chat-websocket'
import { useChatAI } from '~/hooks/use-chat-ai'
import { ChatHeader } from './-components/chat/chat-header'
import { MessageList } from './-components/chat/message-list'
import { ChatInput } from './-components/chat/chat-input'
import { ReviewPanel } from './-components/chat/review-panel'
import { AISidebar } from './-components/chat/ai-sidebar'
import { MobileSidebarSheet } from './-components/chat/mobile-sidebar-sheet'
import { LoggedOutOverlay } from './-components/chat/logged-out-overlay'

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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
    mood,
    coaching,
    tensionFlag,
    review,
    suggestionsLoading,
    moodLoading,
    reviewLoading,
    aiError,
    reviewDraft,
    clearReview,
    healthScore,
    partnerProfile,
    recentInsights,
    partnerName,
    contactJid,
    totalMessages,
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
    if (!contactJid) return
    requestResync(contactJid)
  }, [requestResync, contactJid])

  const handleReview = useCallback(
    (text: string) => {
      reviewDraft(text)
    },
    [reviewDraft],
  )

  const handleUseSuggestion = useCallback(
    (text: string) => {
      setInputText(text)
      setMobileSidebarOpen(false)
    },
    [],
  )

  const handleUseRevised = useCallback(() => {
    if (review?.revised) {
      setInputText(review.revised)
      clearReview()
    }
  }, [review, clearReview])

  return (
    <div className="flex h-dvh -mb-20 md:mb-0 relative">
      {/* Logged out overlay */}
      {isLoggedOut && <LoggedOutOverlay />}

      {/* Chat column */}
      <div className="flex-1 flex flex-col min-w-0 lg:max-w-[65%]">
        <ChatHeader
          partnerName={wsPartnerName !== 'Partner' ? wsPartnerName : partnerName}
          connectionStatus={connectionStatus}
          onResync={handleResync}
          isResyncing={isResyncing}
        />
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

      {/* Desktop AI sidebar */}
      <div className="hidden lg:flex lg:w-[35%] lg:flex-col">
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
          onUseSuggestion={handleUseSuggestion}
          partnerProfile={partnerProfile}
          recentInsights={recentInsights}
        />
      </div>

      {/* Mobile sidebar sheet */}
      <MobileSidebarSheet
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      >
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
          onUseSuggestion={handleUseSuggestion}
          partnerProfile={partnerProfile}
          recentInsights={recentInsights}
        />
      </MobileSidebarSheet>

      {/* Mobile FAB to open sidebar */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-40 w-12 h-12 bg-coral-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-coral-600 transition-colors"
        aria-label="Open AI sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      </button>
    </div>
  )
}
