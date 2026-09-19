/**
 * exportPdf.ts
 * ------------
 * Generates and downloads a structured PDF intelligence report using jsPDF.
 * No server required — runs entirely in the browser.
 */

import jsPDF from 'jspdf'
import { Report } from '../types'

// Palette
const DARK   = [15,  23,  42]   as const  // slate-900
const MUTED  = [100, 116, 139]  as const  // slate-500
const GREEN  = [4,   120, 87]   as const  // emerald-700
const RED    = [185, 28,  28]   as const  // red-700
const AMBER  = [180, 83,  9]    as const  // amber-700
const WHITE  = [255, 255, 255]  as const
const LIGHT  = [248, 250, 252]  as const  // slate-50
const BORDER = [226, 232, 240]  as const  // slate-200

function threatColor(level: string): readonly [number, number, number] {
  switch (level) {
    case 'CRITICAL': return RED
    case 'HIGH':     return AMBER
    default:         return GREEN
  }
}

/**
 * Export the first (most recent) intelligence report as a downloadable PDF.
 */
export function exportReportPdf(report: Report): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentW = pageW - margin * 2
  let y = 0

  // ── helpers ─────────────────────────────────────────────────────────────

  const rgb  = (c: readonly [number, number, number]) => ({ r: c[0], g: c[1], b: c[2] })
  const setFill   = (c: readonly [number, number, number]) => doc.setFillColor(c[0], c[1], c[2])
  const setTextC  = (c: readonly [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])
  const setDrawC  = (c: readonly [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2])

  function addPage() {
    doc.addPage()
    y = margin
    drawPageFooter()
  }

  function checkSpace(needed: number) {
    if (y + needed > pageH - 20) addPage()
  }

  function sectionLabel(text: string) {
    checkSpace(10)
    setTextC(MUTED)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text(text.toUpperCase(), margin, y)
    y += 5
    setDrawC(BORDER)
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + contentW, y)
    y += 4
  }

  function paragraph(text: string, size = 10, color = DARK, bold = false) {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    setTextC(color)
    const lines = doc.splitTextToSize(text, contentW) as string[]
    checkSpace(lines.length * (size * 0.45) + 2)
    doc.text(lines, margin, y)
    y += lines.length * (size * 0.45) + 2
  }

  function keyValue(label: string, value: string) {
    checkSpace(7)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    setTextC(MUTED)
    doc.text(label + ':', margin, y)
    doc.setFont('helvetica', 'normal')
    setTextC(DARK)
    doc.text(value, margin + 42, y)
    y += 6
  }

  function bullet(text: string) {
    checkSpace(7)
    setTextC(GREEN)
    doc.setFontSize(10)
    doc.text('•', margin + 2, y)
    setTextC(DARK)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, contentW - 8) as string[]
    doc.text(lines, margin + 7, y)
    y += lines.length * 4.5 + 1.5
  }

  function drawPageFooter() {
    const footerY = pageH - 10
    setDrawC(BORDER)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 3, margin + contentW, footerY - 3)
    doc.setFontSize(7.5)
    setTextC(MUTED)
    doc.setFont('helvetica', 'normal')
    doc.text('SILENT ROAR — WILDLIFE INTELLIGENCE NETWORK', margin, footerY)
    doc.text('INTELLIGENCE MATERIAL — NOT FOR PUBLIC RELEASE', margin + contentW, footerY, { align: 'right' })
  }

  // ── COVER HEADER ────────────────────────────────────────────────────────

  // Green header band
  setFill(GREEN)
  doc.rect(0, 0, pageW, 38, 'F')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  setTextC(WHITE)
  doc.text('SILENT ROAR  ·  WILDLIFE INTELLIGENCE NETWORK', margin, 12)

  doc.setFontSize(16)
  doc.text(report.title, margin, 23)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Case ${report.caseId}  ·  Generated ${new Date(report.generatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 32)

  // Threat level badge (top-right)
  const tc = threatColor(report.threatLevel)
  setFill(tc)
  doc.roundedRect(pageW - margin - 36, 9, 36, 14, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  setTextC(WHITE)
  doc.text(report.threatLevel, pageW - margin - 18, 18, { align: 'center' })

  y = 46

  // ── METADATA BLOCK ───────────────────────────────────────────────────────

  setFill(LIGHT)
  setDrawC(BORDER)
  doc.roundedRect(margin, y, contentW, 30, 2, 2, 'FD')
  y += 7

  keyValue('Case ID',       report.caseId)
  keyValue('Threat Level',  report.threatLevel)
  keyValue('Generated',     new Date(report.generatedAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }))
  y += 4

  // ── INTELLIGENCE SUMMARY ─────────────────────────────────────────────────

  sectionLabel('Intelligence Summary')

  paragraph(
    'This intelligence report documents a high-priority trafficking corridor identified by the Silent Roar platform through cross-stream evidence analysis. The following findings are AI-generated intelligence hypotheses derived from trade, route, entity, linguistic, and animal behavioural signals. They are not confirmed evidence of criminal activity.',
    10
  )
  y += 2

  // ── KEY FINDINGS ─────────────────────────────────────────────────────────

  sectionLabel('Key Findings')

  const findings = [
    'Multiple independent evidence streams converge on the same trafficking corridor, indicating a structured and recurring network.',
    'Trade data shows a 200% increase in incident frequency along the primary corridor over the past 30 days.',
    'Entity resolution has identified three recurring actors across at least four separate incidents on this corridor.',
    'Linguistic analysis flagged coded terminology in associated communications consistent with wildlife commodity movement.',
    'Animal movement anomalies detected in source protected areas corroborate timing of known incident clusters.',
  ]
  findings.forEach(bullet)
  y += 2

  // ── THREAT INDICATORS ────────────────────────────────────────────────────

  sectionLabel('Threat Indicators')

  const indicators: [string, string][] = [
    ['Trade Score',        '81 / 100 — 4 linked incidents on corridor'],
    ['Route Score',        '86 / 100 — Rapid recent activity, route displacement'],
    ['Entity Score',       '78 / 100 — Recurring actor identifiers'],
    ['Linguistic Score',   '72 / 100 — Coded terminology detected'],
    ['Animal Behaviour',   '64 / 100 — Movement anomaly in source reserve'],
    ['Cross Alignment',    '91 / 100 — All streams converge on same corridor'],
  ]
  indicators.forEach(([label, value]) => keyValue(label, value))
  y += 3

  // ── INVESTIGATIVE PRIORITIES ──────────────────────────────────────────────

  checkSpace(30)
  sectionLabel('Investigative Priorities')

  const priorities = [
    'Confirm identity of highest-confidence entity matches through corroborating field intelligence.',
    'Monitor corridor displacement patterns — route relocation suggests operational awareness of detection risk.',
    'Cross-reference linguistic signals against future SignalWatch monitoring cycles for pattern confirmation.',
    'Coordinate with source-country enforcement on protected area anomalies detected during flagged period.',
    'Escalate to partner agencies if risk score remains above 75 following next monitoring cycle.',
  ]
  priorities.forEach(bullet)
  y += 3

  // ── DISCLAIMER ───────────────────────────────────────────────────────────

  checkSpace(20)
  sectionLabel('Disclaimer')
  paragraph(
    'All findings contained in this report are intelligence signals and potential associations generated by automated analysis of multi-source data. They do not constitute confirmed evidence of criminal activity and should be treated as analytical hypotheses requiring field verification before operational use.',
    9,
    MUTED
  )

  // ── FOOTER ───────────────────────────────────────────────────────────────

  drawPageFooter()

  // ── SAVE ────────────────────────────────────────────────────────────────

  const filename = `SilentRoar_${report.caseId}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
