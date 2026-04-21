<template>
  <div class="header-left">
    <el-icon class="collapse-btn" @click="appStore.toggleSidebar" :size="20">
      <Fold v-if="!appStore.sidebarCollapsed" />
      <Expand v-else />
    </el-icon>
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-if="$route.meta.parent">{{ $route.meta.parent }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
    </el-breadcrumb>
  </div>

  <div class="header-center">
    <el-tag type="warning" effect="plain" size="small">
      必读：软件仅限正规行业，且内容要真实性。请勿夸大宣传、伪造专家及报告、冒充权威、虚假宣传等手段，勿违反广告法。
    </el-tag>
  </div>

  <div class="header-right">
    <div class="wallet" v-if="userStore.userInfo">
      <span class="wallet-item"><el-icon><Coin /></el-icon>{{ userStore.userInfo.points || 0 }} 点</span>
      <span class="wallet-divider">|</span>
      <span class="wallet-item">¥ {{ (userStore.userInfo.balance || 0).toFixed(2) }}</span>
      <el-button size="small" type="primary" plain @click="rechargeOpen = true" style="margin-left: 8px">充值</el-button>
    </div>
    <div class="vip-badge" v-if="userStore.userInfo?.vipExpiry">
      <el-icon><Medal /></el-icon>
      <span>有效期：{{ userStore.userInfo.vipExpiry }}</span>
    </div>
    <el-dropdown trigger="click">
      <div class="user-info">
        <el-avatar :size="32" :style="{ background: '#7c3aed' }">
          {{ userStore.userInfo?.nickname?.[0] || 'U' }}
        </el-avatar>
        <span class="username">{{ userStore.userInfo?.nickname || '用户' }}</span>
        <el-icon><ArrowDown /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="$router.push('/user/benefits')">
            <el-icon><Trophy /></el-icon>账号权益
          </el-dropdown-item>
          <el-dropdown-item @click="$router.push('/user/verification')">
            <el-icon><Postcard /></el-icon>实名认证
          </el-dropdown-item>
          <el-dropdown-item @click="rechargeOpen = true">
            <el-icon><Money /></el-icon>账户充值
          </el-dropdown-item>
          <el-dropdown-item @click="passwordOpen = true">
            <el-icon><Lock /></el-icon>修改密码
          </el-dropdown-item>
          <el-dropdown-item v-if="isAdmin" divided @click="$router.push('/admin/verifications')">
            <el-icon><Setting /></el-icon>管理员面板
          </el-dropdown-item>
          <el-dropdown-item divided @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>

  <ChangePasswordDialog v-model="passwordOpen" />
  <RechargeDialog v-model="rechargeOpen" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import RechargeDialog from '@/components/RechargeDialog.vue'
import request from '@/utils/request'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

const passwordOpen = ref(false)
const rechargeOpen = ref(false)
const role = ref('user')
const isAdmin = computed(() => role.value === 'admin')

async function loadProfile() {
  try {
    const profile = await request.get('/user/profile')
    role.value = profile.role || 'user'
    userStore.setUserInfo({
      id: profile.id,
      username: profile.username,
      nickname: profile.nickname,
      avatar: profile.avatar,
      vipExpiry: profile.vipExpiry,
      balance: profile.balance,
      points: profile.points,
    })
  } catch {}
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

onMounted(loadProfile)
</script>

<style scoped lang="scss">
.header-left { display: flex; align-items: center; gap: 12px; }
.collapse-btn { cursor: pointer; color: #606266; &:hover { color: #7c3aed; } }
.header-center { flex: 1; display: flex; justify-content: center; padding: 0 20px; overflow: hidden; .el-tag { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
.header-right { display: flex; align-items: center; gap: 16px; }
.wallet {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #7c3aed;
  background: #f3f0ff;
  padding: 4px 10px;
  border-radius: 20px;
  .wallet-item { display: inline-flex; align-items: center; gap: 4px; }
  .wallet-divider { color: #d1c7ff; }
}
.vip-badge { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #e6a23c; background: #fdf6ec; padding: 4px 12px; border-radius: 20px; border: 1px solid #f5dab1; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 8px; &:hover { background: #f5f7fa; } .username { font-size: 14px; color: #303133; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
</style>
