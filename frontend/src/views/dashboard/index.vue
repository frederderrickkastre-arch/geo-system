<template>
  <div class="dashboard">
    <!-- Banner Area -->
    <div class="banner-section">
      <div class="banner-cards">
        <div class="banner-card" v-for="item in bannerItems" :key="item.title" @click="$router.push(item.route)">
          <el-icon :size="28" :color="item.color"><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- Statistics Charts -->
    <el-row :gutter="16" class="chart-section">
      <el-col :span="12">
        <div class="page-card">
          <div class="card-header">
            <h3>AI创作</h3>
            <span class="card-desc">根据最新时间统计数据</span>
          </div>
          <div ref="chartAI" style="height: 260px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <div class="card-header">
            <h3>发布统计</h3>
            <span class="card-desc">根据最新时间统计数据</span>
          </div>
          <div ref="chartPublish" style="height: 260px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- Quick Navigation -->
      <el-col :span="12">
        <div class="page-card">
          <h3 class="section-title">快速导航</h3>
          <div class="quick-nav">
            <div class="nav-item balance-item">
              <el-icon :size="32" color="#f56c6c"><Wallet /></el-icon>
              <div>
                <div class="nav-label">余额</div>
                <div class="nav-value">余额: {{ userStore.userInfo?.balance?.toFixed(2) || '0.00' }}元</div>
              </div>
            </div>
            <router-link to="/data/report" class="nav-item">
              <el-icon :size="32" color="#409eff"><Monitor /></el-icon>
              <div>
                <div class="nav-label">数据大屏</div>
                <div class="nav-desc">查看统计报表</div>
              </div>
            </router-link>
            <router-link to="/material/keyword" class="nav-item">
              <el-icon :size="32" color="#67c23a"><Key /></el-icon>
              <div>
                <div class="nav-label">关键词</div>
                <div class="nav-desc">前往拓展问题</div>
              </div>
            </router-link>
            <router-link to="/writing/task" class="nav-item">
              <el-icon :size="32" color="#e6a23c"><EditPen /></el-icon>
              <div>
                <div class="nav-label">AI创作</div>
                <div class="nav-desc">大模型自动创作</div>
              </div>
            </router-link>
          </div>
        </div>
      </el-col>

      <!-- Operation Flow -->
      <el-col :span="12">
        <div class="page-card">
          <h3 class="section-title">操作流程</h3>
          <div class="flow-steps">
            <router-link v-for="step in flowSteps" :key="step.title" :to="step.route" class="flow-step">
              <div class="step-icon" :style="{ background: step.bg }">
                <el-icon :size="20" color="#fff"><component :is="step.icon" /></el-icon>
              </div>
              <div class="step-info">
                <div class="step-title">{{ step.title }}</div>
                <div class="step-action">{{ step.action }}</div>
              </div>
              <el-icon class="step-arrow" color="#dcdfe6"><ArrowRight /></el-icon>
            </router-link>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'
import {
  MagicStick, EditPen, Promotion, Search, DataAnalysis, Setting,
  Wallet, Monitor, Key, ArrowRight, Document, Picture, ChatLineSquare,
  Tickets, Connection
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const chartAI = ref<HTMLElement>()
const chartPublish = ref<HTMLElement>()

const bannerItems = [
  { title: 'AI写作', icon: markRaw(EditPen), color: '#7c3aed', route: '/writing/task' },
  { title: '发布媒体', icon: markRaw(Search), color: '#3b82f6', route: '/publish/web-media' },
  { title: '数据报表', icon: markRaw(DataAnalysis), color: '#10b981', route: '/data/report' },
  { title: 'AI工具', icon: markRaw(Setting), color: '#f59e0b', route: '/tools/keyword-index' },
]

const flowSteps = [
  { title: '创建关键词', action: '去创建', route: '/material/keyword', icon: markRaw(Key), bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { title: '上传图片', action: '去上传', route: '/material/image-gallery', icon: markRaw(Picture), bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { title: '创建提示词', action: '去创建', route: '/writing/prompt', icon: markRaw(ChatLineSquare), bg: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { title: '创建写作任务', action: '去创建', route: '/writing/task', icon: markRaw(Tickets), bg: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { title: '发布', action: '去发布', route: '/publish/web-media', icon: markRaw(Connection), bg: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { title: '查看报表', action: '去查看', route: '/data/report', icon: markRaw(Document), bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
]

function initCharts() {
  const dates = getLast7Days()

  if (chartAI.value) {
    const c1 = echarts.init(chartAI.value)
    c1.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: dates, boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        data: [0, 0, 2, 5, 3, 8, 0],
        type: 'line',
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(124,58,237,0.3)' },
          { offset: 1, color: 'rgba(124,58,237,0.02)' },
        ])},
        lineStyle: { color: '#7c3aed', width: 2 },
        itemStyle: { color: '#7c3aed' },
      }],
    })
    window.addEventListener('resize', () => c1.resize())
  }

  if (chartPublish.value) {
    const c2 = echarts.init(chartPublish.value)
    c2.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: dates, boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        data: [0, 1, 0, 3, 2, 6, 0],
        type: 'line',
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59,130,246,0.3)' },
          { offset: 1, color: 'rgba(59,130,246,0.02)' },
        ])},
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
      }],
    })
    window.addEventListener('resize', () => c2.resize())
  }
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`)
  }
  return days
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped lang="scss">
.dashboard {
  max-width: 1400px;
}

.banner-section {
  margin-bottom: 16px;
}

.banner-cards {
  display: flex;
  gap: 12px;
}

.banner-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  font-size: 15px;
  font-weight: 500;
  color: #303133;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;

  h3 {
    font-size: 16px;
    color: #303133;
  }

  .card-desc {
    font-size: 12px;
    color: #909399;
  }
}

.section-title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.quick-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fe;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;

  &:hover {
    background: #eef0fb;
  }

  .nav-label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .nav-value {
    font-size: 12px;
    color: #f56c6c;
    margin-top: 2px;
  }

  .nav-desc {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}

.flow-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafbfc;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;

  &:hover {
    background: #f0f2f5;
    transform: translateX(4px);
  }

  .step-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .step-info {
    flex: 1;
  }

  .step-title {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }

  .step-action {
    font-size: 12px;
    color: #7c3aed;
    margin-top: 2px;
  }

  .step-arrow {
    flex-shrink: 0;
  }
}
</style>
