import { Evidence } from '../../types'
import { formatDateTime } from '../../utils/format'
import { locationById } from '../../data/locations'
import { Badge } from '../ui/Badge'
import { ConfidenceBar } from '../ui/States'
import { Boxes, Satellite, PawPrint, MessageSquareText, Waypoints, FileText } from 'lucide-react'
import { cx } from '../../utils/format'

const typeIcon: Record<string, typeof Boxes> = {
  TRADE:      Boxes,
  SATELLITE:  Satellite,
  BEHAVIOUR:  PawPrint,
  LINGUISTIC: MessageSquareText,
  NETWORK:    Waypoints,
  DOCUMENT:   FileText,
}

const typeBg: Record<string, string> = {
  TRADE:      'bg-amber-50 text-amber-600',
  SATELLITE:  'bg-blue-50 text-blue-600',
  BEHAVIOUR:  'bg-emerald-50 text-emerald-700',
  LINGUISTIC: 'bg-violet-50 text-violet-600',
  NETWORK:    'bg-teal-50 text-teal-600',
  DOCUMENT:   'bg-slate-100 text-slate-600',
}

const statusTone: Record<string, 'emerald' | 'cyan' | 'default'> = {
  SUPPORTING:    'emerald',
  CORROBORATING: 'cyan',
  UNVERIFIED:    'default',
}

export function EvidenceCard({ item }: { item: Evidence }) {
  // Safe fallbacks — backend may return unexpected values
  const type = (item.type ?? 'DOCUMENT').toString().toUpperCase()
  const status = (item.status ?? 'UNVERIFIED').toString().toUpperCase()
  const Icon = typeIcon[type] ?? FileText
  const iconClass = typeBg[type] ?? 'bg-slate-100 text-slate-500'
  const loc = item.locationId ? locationById(item.locationId) : undefined

  return (
    <div className="panel card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconClass)}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{type}</div>
            <div className="truncate font-display text-[13.5px] font-semibold text-ink-100">
              {item.title ?? item.id}
            </div>
          </div>
        </div>
        <Badge tone={statusTone[status] ?? 'default'}>{status}</Badge>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-400">
        {item.description ?? 'No description available.'}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-[12px]">
        <InfoField label="Timestamp" value={item.timestamp ? formatDateTime(item.timestamp) : '—'} />
        <InfoField label="Source" value={item.source ?? '—'} />
        <InfoField label="Location" value={loc?.name ?? '—'} />
        <InfoField label="Relationships" value={String(item.relationshipCount ?? 0)} />
      </div>

      <div className="mt-3">
        <ConfidenceBar value={typeof item.confidence === 'number' ? item.confidence : 0} compact />
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-slate-400">{label}: </span>
      <span className="text-ink-300">{value}</span>
    </div>
  )
}
