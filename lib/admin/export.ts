/** Wraps a cell in quotes when it contains a delimiter, quote or newline. */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''

  const text =
    typeof value === 'object' ? JSON.stringify(value) : String(value)

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(
  rows: Record<string, unknown>[],
  headers: { key: string; label: string }[],
): string {
  const head = headers.map((header) => escapeCsvCell(header.label)).join(',')
  const body = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header.key])).join(','),
  )

  return [head, ...body].join('\r\n')
}

/**
 * Triggers a client-side file download. Excel reads CSV natively, so one export
 * path covers both the CSV and Excel asks without pulling in a spreadsheet
 * library. The BOM is what makes Excel read UTF-8 (Bangla names) correctly.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
