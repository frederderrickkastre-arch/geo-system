<template>
  <div class="app-footer">
    <span>Copyright &copy; 2026 GEO 优化排名系统</span>
    <span class="sep">|</span>
    <router-link to="/legal/terms" class="link">用户协议</router-link>
    <span class="sep">|</span>
    <router-link to="/legal/privacy" class="link">隐私政策</router-link>
    <span class="sep" v-if="icp">|</span>
    <a v-if="icp" href="https://beian.miit.gov.cn/" target="_blank" class="link">{{ icp }}</a>
  </div>
</template>

<script setup lang="ts">
const icp = (import.meta as any).env?.VITE_ICP || ''
</script>

<style scoped lang="scss">
.app-footer {
  text-align: center;
  padding: 12px 16px;
  font-size: 12px;
  color: #909399;
  background: transparent;

  .sep { margin: 0 8px; color: #dcdfe6; }
  .link { color: #909399; text-decoration: none; &:hover { color: #7c3aed; } }
}
</style>
