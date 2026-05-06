import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import { previewChatExport, uploadChatExport } from '~/server/chat-export'

export const Route = createFileRoute('/_authenticated/upload')({
  component: UploadPage,
})

type Step = 'select' | 'preview' | 'sender' | 'analyzing' | 'done' | 'error'

interface PreviewData {
  senders: string[]
  messageCount: number
  dateRange: { start: string; end: string } | null
  preview: Array<{
    sender: string
    text: string
    timestamp: string
    isMedia: boolean
  }>
  skippedLines: number
}

interface AnalysisResult {
  healthScore: number
  summary: string
  messageCount: number
}

const MAX_SIZE = 5 * 1024 * 1024

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('select')
  const [fileContent, setFileContent] = useState('')
  const [filename, setFilename] = useState('')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 5MB.')
      return
    }

    let text: string

    if (file.name.endsWith('.zip')) {
      // Try to extract .txt from zip
      try {
        const { unzipSync } = await import('fflate')
        const buffer = await file.arrayBuffer()
        const unzipped = unzipSync(new Uint8Array(buffer))

        // Find the first .txt file
        const txtEntry = Object.entries(unzipped).find(([name]) =>
          name.endsWith('.txt') && !name.startsWith('__MACOSX'),
        )

        if (!txtEntry) {
          setError('No .txt file found inside the zip. Please select the WhatsApp .txt export directly.')
          return
        }

        text = new TextDecoder().decode(txtEntry[1])
      } catch {
        setError('Failed to read the zip file. Please try uploading the .txt file directly.')
        return
      }
    } else {
      text = await file.text()
    }

    setFileContent(text)
    setFilename(file.name)

    try {
      const data = await previewChatExport({ data: { fileContent: text } })
      setPreview(data)

      if (data.senders.length === 2) {
        setStep('sender')
      } else if (data.senders.length === 1) {
        // Only one sender detected — unusual but allow
        setSelectedSender(data.senders[0])
        setStep('preview')
      } else {
        setError('Could not detect conversation participants.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse the file.')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }, [handleFile])

  const handleSelectSender = (sender: string) => {
    setSelectedSender(sender)
    setStep('preview')
  }

  const handleAnalyze = async () => {
    if (!selectedSender || !preview) return

    setStep('analyzing')
    setError(null)

    try {
      const data = await uploadChatExport({
        data: {
          fileContent,
          filename,
          userSenderName: selectedSender,
        },
      })

      setResult({
        healthScore: data.healthScore,
        summary: data.summary,
        messageCount: data.messageCount,
      })
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
      setStep('error')
    }
  }

  const handleReset = () => {
    setStep('select')
    setFileContent('')
    setFilename('')
    setPreview(null)
    setSelectedSender(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-warm-900 mb-2">Upload a WhatsApp chat</h1>
        <p className="text-sm text-warm-500 leading-relaxed">
          Export a conversation from WhatsApp, upload the .txt file, and get relationship insights in under a minute.
        </p>
      </div>

      {/* Step: File selection */}
      {step === 'select' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-warm-300 bg-white px-8 py-16 text-center transition-colors hover:border-coral-300 hover:bg-coral-50/30"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-coral-50">
            <svg className="h-8 w-8 text-coral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-base font-medium text-warm-800 mb-1">
            Drop a file here or click to browse
          </p>
          <p className="text-sm text-warm-400">
            Accepts .txt or .zip WhatsApp exports (max 5MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </div>
      )}

      {/* Step: Sender selection */}
      {step === 'sender' && preview && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-warm-900 mb-1">Which one is you?</h2>
            <p className="text-sm text-warm-500 mb-4">
              We found {preview.messageCount.toLocaleString()} messages between two people.
              Select your name so we can analyze the conversation correctly.
            </p>
            <div className="space-y-3">
              {preview.senders.map((sender) => (
                <button
                  key={sender}
                  onClick={() => handleSelectSender(sender)}
                  className="w-full rounded-xl border border-warm-200 bg-warm-50 px-5 py-4 text-left font-medium text-warm-800 transition-colors hover:border-coral-300 hover:bg-coral-50"
                >
                  {sender}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
          >
            Choose a different file
          </button>
        </div>
      )}

      {/* Step: Preview + confirm */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-warm-900">Preview</h2>
              <span className="rounded-full bg-warm-100 px-3 py-1 text-xs font-medium text-warm-600">
                {preview.messageCount.toLocaleString()} messages
              </span>
            </div>

            {preview.dateRange && (
              <p className="text-sm text-warm-500 mb-4">
                {formatDate(preview.dateRange.start)} to {formatDate(preview.dateRange.end)}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {preview.preview.map((msg, i) => (
                <div key={i} className="rounded-xl bg-warm-50 px-4 py-2.5">
                  <span className="text-xs font-semibold text-coral-600">{msg.sender}</span>
                  <p className="text-sm text-warm-700 mt-0.5">
                    {msg.isMedia ? '(media)' : msg.text}
                  </p>
                </div>
              ))}
            </div>

            {preview.messageCount < 10 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4">
                <p className="text-sm text-amber-800">
                  Only {preview.messageCount} messages found. For better insights, upload a conversation with at least 50 messages.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => void handleAnalyze()}
                className="flex-1 rounded-xl bg-coral-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coral-600"
              >
                Analyze conversation
              </button>
              <button
                onClick={handleReset}
                className="rounded-xl border border-warm-200 px-4 py-3 text-sm font-medium text-warm-600 transition-colors hover:bg-warm-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="rounded-2xl border border-warm-200 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-3 border-coral-200 border-t-coral-500" />
          <h2 className="text-lg font-semibold text-warm-900 mb-2">Analyzing your conversation</h2>
          <p className="text-sm text-warm-500">
            This usually takes 30-60 seconds. We're looking at communication patterns, sentiment, and relationship dynamics.
          </p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-warm-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-coral-50">
              <span className="text-3xl font-bold text-coral-600">{result.healthScore}</span>
            </div>
            <h2 className="text-lg font-semibold text-warm-900 mb-2">Your relationship health score</h2>
            <p className="text-sm text-warm-500 leading-relaxed max-w-sm mx-auto">
              {result.summary}
            </p>
            <p className="mt-3 text-xs text-warm-400">
              Based on {result.messageCount.toLocaleString()} messages analyzed
            </p>
          </div>

          <button
            onClick={() => navigate({ to: '/dashboard', search: { upgraded: false } })}
            className="w-full rounded-xl bg-coral-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coral-600"
          >
            View full dashboard
          </button>

          <button
            onClick={handleReset}
            className="w-full rounded-xl border border-warm-200 px-6 py-3 text-sm font-medium text-warm-600 transition-colors hover:bg-warm-50"
          >
            Upload another conversation
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <h2 className="text-base font-semibold text-red-800 mb-1">Something went wrong</h2>
            <p className="text-sm text-red-600">{error}</p>
          </div>

          <button
            onClick={handleReset}
            className="w-full rounded-xl bg-coral-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coral-600"
          >
            Try again
          </button>
        </div>
      )}

      {/* Inline error (for file selection errors) */}
      {error && step === 'select' && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Help section */}
      {(step === 'select' || step === 'sender') && (
        <div className="mt-8 rounded-2xl border border-warm-200/60 bg-warm-50 p-6">
          <h3 className="text-sm font-semibold text-warm-800 mb-3">How to export a WhatsApp chat</h3>
          <ol className="space-y-2 text-sm text-warm-600">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warm-200 text-xs font-bold text-warm-600">1</span>
              Open the conversation in WhatsApp
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warm-200 text-xs font-bold text-warm-600">2</span>
              Tap the three dots (or contact name) at the top
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warm-200 text-xs font-bold text-warm-600">3</span>
              Select "Export chat" and choose "Without Media"
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warm-200 text-xs font-bold text-warm-600">4</span>
              Save the .txt file and upload it here
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
