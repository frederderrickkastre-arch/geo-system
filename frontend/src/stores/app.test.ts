import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from './app'

describe('app store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts with sidebar expanded', () => {
    const s = useAppStore()
    expect(s.sidebarCollapsed).toBe(false)
  })

  it('toggleSidebar flips the flag', () => {
    const s = useAppStore()
    s.toggleSidebar()
    expect(s.sidebarCollapsed).toBe(true)
    s.toggleSidebar()
    expect(s.sidebarCollapsed).toBe(false)
  })
})
