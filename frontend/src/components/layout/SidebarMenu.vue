<template>
  <div class="sidebar-logo" @click="$router.push('/')">
    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%237c3aed'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3EG%3C/text%3E%3C/svg%3E" alt="logo" class="logo-icon" />
    <span v-show="!collapsed" class="logo-text">GEO优化排名系统</span>
  </div>

  <el-menu
    :default-active="$route.path"
    :collapse="collapsed"
    background-color="transparent"
    text-color="#ffffffcc"
    active-text-color="#a78bfa"
    router
    class="sidebar-nav"
  >
    <el-menu-item index="/dashboard">
      <el-icon><HomeFilled /></el-icon>
      <template #title>首页</template>
    </el-menu-item>

    <div v-show="!collapsed" class="menu-group-title">AI创作准备</div>

    <el-sub-menu index="material">
      <template #title>
        <el-icon><MagicStick /></el-icon>
        <span>AI素材源力</span>
      </template>
      <el-menu-item index="/material/keyword">关键词</el-menu-item>
      <el-menu-item index="/material/question">写作标题</el-menu-item>
      <el-menu-item index="/material/image-gallery">企业画像图库</el-menu-item>
      <el-menu-item index="/material/knowledge-base">企业知识库</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="writing">
      <template #title>
        <el-icon><EditPen /></el-icon>
        <span>AI文章写作</span>
      </template>
      <el-menu-item index="/writing/prompt">写作指令</el-menu-item>
      <el-menu-item index="/writing/category">文章分类</el-menu-item>
      <el-menu-item index="/writing/task">AI写作任务</el-menu-item>
      <el-menu-item index="/writing/article">文章列表</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="traffic">
      <template #title>
        <el-icon><Promotion /></el-icon>
        <span>AI流量复刻</span>
      </template>
      <el-menu-item index="/traffic/hot-article">全网爆文复刻</el-menu-item>
      <el-menu-item index="/traffic/batch-rewrite">批量爆文复刻</el-menu-item>
    </el-sub-menu>

    <div v-show="!collapsed" class="menu-group-title">文章发布</div>

    <el-sub-menu index="webmedia">
      <template #title>
        <el-icon><Search /></el-icon>
        <span>网站媒体</span>
      </template>
      <el-menu-item index="/publish/web-media">发布媒体</el-menu-item>
      <el-menu-item index="/publish/web-media/records">投稿记录</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="selfmedia">
      <template #title>
        <el-icon><Grid /></el-icon>
        <span>自媒体大V</span>
      </template>
      <el-menu-item index="/publish/self-media">发布自媒体</el-menu-item>
      <el-menu-item index="/publish/self-media/records">投稿记录</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="personal">
      <template #title>
        <el-icon><Upload /></el-icon>
        <span>个人自媒体</span>
      </template>
      <el-menu-item index="/publish/personal-media">账号授权</el-menu-item>
      <el-menu-item index="/publish/personal-media/tasks">发布任务</el-menu-item>
      <el-menu-item index="/publish/personal-media/records">发布记录</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="seo">
      <template #title>
        <el-icon><Connection /></el-icon>
        <span>AI官网SEO</span>
      </template>
      <el-menu-item index="/publish/seo">站点管理</el-menu-item>
      <el-menu-item index="/publish/seo/tasks">SEO发布任务</el-menu-item>
      <el-menu-item index="/publish/seo/records">发布记录</el-menu-item>
    </el-sub-menu>

    <div v-show="!collapsed" class="menu-group-title">AI数据</div>

    <el-sub-menu index="data">
      <template #title>
        <el-icon><DataAnalysis /></el-icon>
        <span>AI数据中心</span>
      </template>
      <el-menu-item index="/data/report">数据报表</el-menu-item>
      <el-menu-item index="/data/query">查询(带截图)</el-menu-item>
      <el-menu-item index="/data/query-records">查询记录</el-menu-item>
    </el-sub-menu>

    <div v-show="!collapsed" class="menu-group-title">AI工具</div>

    <el-sub-menu index="tools">
      <template #title>
        <el-icon><Setting /></el-icon>
        <span>AI工具助手</span>
      </template>
      <el-menu-item index="/tools/keyword-index">关键词指数</el-menu-item>
      <el-menu-item index="/tools/ai-expand">AI拓词</el-menu-item>
      <el-menu-item index="/tools/manual-expand">手动拓词工具</el-menu-item>
    </el-sub-menu>

    <div v-show="!collapsed" class="menu-group-title">个人中心</div>

    <el-sub-menu index="consumption">
      <template #title>
        <el-icon><Coin /></el-icon>
        <span>消耗明细</span>
      </template>
      <el-menu-item index="/user/consumption">点数明细</el-menu-item>
    </el-sub-menu>

    <el-menu-item index="/user/verification">
      <el-icon><Postcard /></el-icon>
      <template #title>实名认证</template>
    </el-menu-item>

    <el-menu-item index="/user/benefits">
      <el-icon><Trophy /></el-icon>
      <template #title>账号权益</template>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const collapsed = computed(() => appStore.sidebarCollapsed)
</script>

<style scoped lang="scss">
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.menu-group-title {
  padding: 16px 20px 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.sidebar-nav {
  border-right: none !important;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
    border-radius: 8px;
    margin: 2px 8px;
    padding-left: 16px !important;

    &:hover {
      background: rgba(255, 255, 255, 0.06) !important;
    }
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(99, 102, 241, 0.2)) !important;
    color: #a78bfa !important;
  }

  :deep(.el-sub-menu .el-menu) {
    background: transparent !important;
  }

  :deep(.el-sub-menu .el-menu .el-menu-item) {
    padding-left: 48px !important;
    font-size: 13px;
    height: 38px;
    line-height: 38px;
  }
}
</style>
