import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  vipExpiry: string
  balance: number
  points: number
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('geo_token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('geo_token', t)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  async function login(username: string, password: string) {
    const data = await request.post('/auth/login', { username, password })
    setToken(data.token)
    setUserInfo(data.userInfo)
    return true
  }

  function logout() {
    request.post('/auth/logout').catch(() => {})
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('geo_token')
  }

  async function restoreSession() {
    if (token.value && !userInfo.value) {
      try {
        const data = await request.get('/user/profile')
        setUserInfo(data)
      } catch {
        logout()
      }
    }
  }

  return { token, userInfo, isLoggedIn, setToken, setUserInfo, login, logout, restoreSession }
})
