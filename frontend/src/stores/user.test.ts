import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/utils/request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import request from '@/utils/request'
import { useUserStore } from './user'

describe('user store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts logged out when no token in storage', () => {
    const s = useUserStore()
    expect(s.token).toBe('')
    expect(s.isLoggedIn).toBe(false)
  })

  it('restores token from localStorage', () => {
    localStorage.setItem('geo_token', 'cached-token')
    const s = useUserStore()
    expect(s.token).toBe('cached-token')
    expect(s.isLoggedIn).toBe(true)
  })

  it('login persists token and userInfo', async () => {
    ;(request.post as any).mockResolvedValue({
      token: 't1',
      userInfo: {
        id: 1,
        username: 'alice',
        nickname: 'A',
        avatar: '',
        vipExpiry: '',
        balance: 0,
        points: 0,
      },
    })
    const s = useUserStore()
    await s.login('alice', 'pw')
    expect(s.token).toBe('t1')
    expect(s.userInfo?.username).toBe('alice')
    expect(localStorage.getItem('geo_token')).toBe('t1')
  })

  it('logout clears token, userInfo and storage', () => {
    localStorage.setItem('geo_token', 'x')
    const s = useUserStore()
    s.setUserInfo({
      id: 1,
      username: 'alice',
      nickname: 'A',
      avatar: '',
      vipExpiry: '',
      balance: 0,
      points: 0,
    })
    s.logout()
    expect(s.token).toBe('')
    expect(s.userInfo).toBeNull()
    expect(localStorage.getItem('geo_token')).toBeNull()
  })

  it('restoreSession fetches profile when token is present but userInfo is empty', async () => {
    localStorage.setItem('geo_token', 'cached')
    ;(request.get as any).mockResolvedValue({
      id: 7,
      username: 'bob',
      nickname: 'B',
      avatar: '',
      vipExpiry: '',
      balance: 9.5,
      points: 3,
    })
    const s = useUserStore()
    await s.restoreSession()
    expect(request.get).toHaveBeenCalledWith('/user/profile')
    expect(s.userInfo?.id).toBe(7)
  })

  it('restoreSession logs out on profile failure', async () => {
    localStorage.setItem('geo_token', 'cached')
    ;(request.get as any).mockRejectedValue(new Error('401'))
    ;(request.post as any).mockResolvedValue(undefined)
    const s = useUserStore()
    await s.restoreSession()
    expect(s.token).toBe('')
    expect(s.userInfo).toBeNull()
  })
})
