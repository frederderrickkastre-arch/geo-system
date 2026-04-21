// 简单的前端 CSV 导出工具（BOM 头 + UTF-8 可被 Excel 正确识别）

export interface CsvColumn<T = any> {
  label: string
  prop: keyof T | string
  formatter?: (row: T) => string | number | null | undefined
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportCsv<T = any>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = c.formatter ? c.formatter(row) : (row as any)[c.prop]
          return escapeCell(raw)
        })
        .join(',')
    )
    .join('\n')

  const csv = `﻿${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
