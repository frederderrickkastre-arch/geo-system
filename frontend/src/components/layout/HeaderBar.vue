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
    <div class="vip-badge" v-if="userStore.userInfo">
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
          <el-dropdown-item divided @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;

  &:hover {
    color: #7c3aed;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  overflow: hidden;

  .el-tag {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vip-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #f5dab1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  .username {
    font-size: 14px;
    color: #303133;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
