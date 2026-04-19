import { vi } from 'vitest'

// Element Plus ElMessage touches DOM bits jsdom doesn't implement; stub it
// globally so unit tests don't error on unrelated side effects.
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

// Router is only used as a side effect of the request interceptor. Tests
// that exercise the interceptor can re-mock as needed.
vi.mock('@/router', () => ({
  default: { push: vi.fn() },
}))
