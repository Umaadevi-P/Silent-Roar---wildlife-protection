import { Component, useEffect, useState } from 'react'
import { Evidence, EvidenceType } from '../types'
import { apiClient } from '../services/apiClient'
import { LoadingState, EmptyState } from '../components/ui/States'
import { EvidenceCard } from '../components/evidence/EvidenceCard'
import { cx } from '../utils/format'

type FilterKey = EvidenceType | 'ALL'
const filters: FilterKey[] = ['ALL', 'TRADE', 'SATELLITE', 'BEHAVIOUR', 'LINGUISTIC', 'NETWORK', 'DOCUMENT']

// Error boundary so a single bad card doesn't crash the page
class CardBoundary extends Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[12px] text-slate-400">
          Unable to render this evidence item.
        </div>
      )
    }
    return this.props.children
  }
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[] | null>(null)
  const [filter, setFilter] = useState<FilterKey>('ALL')

  useEffect(() => {
    apiClient.getEvidence().then(setEvidence)
  }, [])

  if (!evidence) return <LoadingState />

  const filtered = evidence.filter((e) => filter === 'ALL' || e.type === filter)

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cx(
              'focus-ring rounded-md border px-3.5 py-1.5 font-ui text-[12.5px] font-semibold uppercase tracking-wide transition-colors',
              filter === f
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
            )}
          >
            {f}
          </button>
        ))}
        <span className="self-center text-[11px] text-slate-400">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No evidence found" description="Try a different category filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, i) => (
            <CardBoundary key={item.id}>
              <div className="animate-scale-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <EvidenceCard item={item} />
              </div>
            </CardBoundary>
          ))}
        </div>
      )}
    </div>
  )
}
