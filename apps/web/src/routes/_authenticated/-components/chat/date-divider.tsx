export function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-warm-200" />
      <span className="text-xs text-warm-400 bg-warm-50 px-2">{date}</span>
      <div className="flex-1 h-px bg-warm-200" />
    </div>
  )
}
