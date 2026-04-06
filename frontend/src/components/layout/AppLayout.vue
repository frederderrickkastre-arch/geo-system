<template>
  <el-container class="app-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="app-sidebar">
      <SidebarMenu />
    </el-aside>
    <el-container>
      <el-header class="app-header" height="56px">
        <HeaderBar />
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import SidebarMenu from './SidebarMenu.vue'
import HeaderBar from './HeaderBar.vue'

const appStore = useAppStore()
const collapsed = computed(() => appStore.sidebarCollapsed)
</script>

<style scoped lang="scss">
.app-layout {
  height: 100vh;
}

.app-sidebar {
  background: linear-gradient(180deg, #2b1055 0%, #1a0a3e 100%);
  transition: width 0.3s;
  overflow-x: hidden;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 0;
  }
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.app-main {
  background: #f0f2f5;
  padding: 16px;
  overflow-y: auto;
}
</style>
