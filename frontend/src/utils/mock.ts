// Mock data layer - provides fake API responses for development
// Replace with real API calls when backend is ready

export function mockDelay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function mockResponse<T>(data: T) {
  return { code: 200, msg: 'success', data }
}

export function mockPageData<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    list: list.slice(start, end),
    total: list.length,
    page,
    pageSize,
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(date?: Date): string {
  const d = date || new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
