import { useEffect, useState } from 'react'
import { FileText, Sparkles, Loader2, Download, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Report, Investigation } from '../types'
import { apiClient } from '../services/apiClient'
import { LoadingState } from '../components/ui/States'
import { SeverityBadge } from '../components/ui/Badge'
import { ReportPreview } from '../components/reports/ReportPreview'
import { formatDate, cx } from '../utils/format'
import { exportReportPdf } from '../utils/exportPdf'

const threatColors: Record<string, string> = {
  CRITICAL: 'border-l-red-500',
  HIGH:     'border-l-amber-500',
  MEDIUM:   'border-l-blue-500',
  WATCH:    'border-l-slate-400',
}

export default function Reports() {
  const [reports, setReports] = useState<Report[] | null>(null)
  const [investigations, setInvestigations] = useState<Investigation[] | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<Investigation | null>(null)
  const [exportedId, setExportedId] = useState<string | null>(null)
  const [viewingReport, setViewingReport] = useState<Report | null>(null)

  useEffect(() => {
    apiClient.getReports().then(setReports)
    apiClient.getInvestigations().then(setInvestigations)
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setGenerated(null)
    const topInvestigation = investigations?.[0]
    const result = topInvestigation
      ? await apiClient.getInvestigationBrief(
          (topInvestigation as any).target_type ?? 'ROUTE',
          topInvestigation.id
        )
      : null
    setGenerating(false)
    setGenerated(result as unknown as Investigation)
  }

  function handleExport(r: Report, isFirst: boolean) {
    if (isFirst) {
      exportReportPdf(r)
      setExportedId(r.id)
      setTimeout(() => setExportedId(null), 2500)
      return
    }
    // Other reports: copy summary to clipboard
    const text = `SILENT ROAR INTELLIGENCE REPORT\n\nCase: ${r.caseId}\nTitle: ${r.title}\nThreat Level: ${r.threatLevel}\nGenerated: ${formatDate(r.generatedAt)}\n\nThis report is classified intelligence material.`
    navigator.clipboard.writeText(text).catch(() => {})
    setExportedId(r.id)
    setTimeout(() => setExportedId(null), 2000)
  }

  if (!reports) return <LoadingState />

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">

      {/* Generate Brief Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="focus-ring flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 py-4 text-[15px] font-bold text-emerald-700 transition-colors hover:bg-emerald-500/15 disabled:opacity-70"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            GENERATING INVESTIGATION BRIEF…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            GENERATE INVESTIGATION BRIEF
          </>
        )}
      </button>

      {/* Generated Preview */}
      {generated && <ReportPreview investigation={generated} />}

      {/* Existing Reports */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-[15px] font-bold text-slate-800">
            Intelligence Reports
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {reports.length} report{reports.length !== 1 ? 's' : ''} on record
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <FileText className="h-8 w-8 text-slate-300" />
            <p className="text-[14px] text-slate-400">No reports yet. Generate an investigation brief above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r, idx) => {
              const isFirst = idx === 0
              return (
              <div
                key={r.id}
                className={cx(
                  'border-l-4',
                  threatColors[r.threatLevel] ?? 'border-l-slate-300'
                )}
              >
                {/* Row */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-display text-[14px] font-semibold text-slate-800">{r.title}</div>
                        {isFirst && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            PDF READY
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                        <span className="font-mono-intel font-medium text-slate-600">{r.caseId}</span>
                        <span className="text-slate-300">·</span>
                        <span>{formatDate(r.generatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={r.threatLevel} />
                    <button
                      onClick={() => handleExport(r, isFirst)}
                      className={cx(
                        'focus-ring flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
                        isFirst
                          ? 'border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      )}
                    >
                      {exportedId === r.id ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {isFirst ? 'Downloading…' : 'Copied'}</>
                      ) : (
                        <><Download className="h-3.5 w-3.5" /> {isFirst ? 'Export PDF' : 'Export'}</>
                      )}
                    </button>
                    <button
                      onClick={() => setViewingReport(viewingReport?.id === r.id ? null : r)}
                      className="focus-ring flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {viewingReport?.id === r.id ? 'Close' : 'View'}
                    </button>
                  </div>
                </div>
                {/* Inline view panel */}
                {viewingReport?.id === r.id && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                      {[
                        { label: 'Case ID',      value: r.caseId },
                        { label: 'Threat Level', value: r.threatLevel },
                        { label: 'Generated',    value: formatDate(r.generatedAt) },
                        { label: 'Status',       value: 'On Record' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
                          <div className="mt-0.5 font-medium text-slate-700">{value}</div>
                        </div>
                      ))}
                    </div>
                    {isFirst ? (
                      <div className="mt-3 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                        <Download className="h-3.5 w-3.5 shrink-0" />
                        Click <strong>Export PDF</strong> to download a fully formatted A4 intelligence brief as a PDF file.
                      </div>
                    ) : (
                      <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                        Full PDF export coming soon for this report. Use <strong>Export</strong> to copy the summary to clipboard.
                      </p>
                    )}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
