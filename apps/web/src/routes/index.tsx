import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-stone-900">Amore Couples</h1>
        <p className="mt-4 text-stone-600">Relationship intelligence, together.</p>
      </div>
    </div>
  )
}
