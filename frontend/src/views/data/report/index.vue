<template>
  <div class="page-container">
    <!-- Header -->
    <div class="report-header">
      <div class="header-content">
        <h1>{{ userStore.userInfo?.nickname || 'GEO' }}报表</h1>
        <p>AI大模型 - 助力品牌曝光</p>
      </div>
      <el-button type="primary" plain @click="ElMessage.success('链接已复制')">
        <el-icon><Share /></el-icon>分享链接
      </el-button>
    </div>

    <!-- KPI Cards -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="6" v-for="kpi in kpiData" :key="kpi.label">
        <div class="kpi-card" :style="{ background: kpi.bg }">
          <el-icon :size="28"><component :is="kpi.icon" /></el-icon>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-desc">{{ kpi.desc }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="page-card">
          <h3 style="margin-bottom: 16px">平台收录占比</h3>
          <div ref="pieChart" style="height: 320px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <h3 style="margin-bottom: 12px">问题收录</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap">
            <el-button v-for="p in platforms" :key="p" :type="activePlatform === p ? 'primary' : 'default'" size="small" @click="activePlatform = p">{{ p }}</el-button>
          </div>
          <div ref="barChart" style="height: 260px"></div>
        </div>
      </el-col>
    </el-row>

    <!-- Keyword Detail Table -->
    <div class="page-card" style="margin-top: 16px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
        <h3>关键词明细</h3>
        <div style="display: flex; gap: 8px">
          <el-input placeholder="搜索关键词" style="width: 200px" clearable size="small" />
          <el-radio-group v-model="tabFilter" size="small">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="indexed">收录({{ reportData?.kpi?.totalIndexed || 0 }})</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <el-table :data="keywordData" stripe>
        <el-table-column prop="keyword" label="主关键词" min-width="180" />
        <el-table-column prop="questionCount" label="问题数" width="120" />
      </el-table>
      <el-empty v-if="!keywordData.length" description="暂无数据" />
    </div>

    <div class="page-card" style="margin-top: 16px; text-align: center; color: #909399; font-size: 12px; padding: 12px">
      特别申明：AI大模型搜索结果千人千面，报表检测结果以系统IP检测结果为准，仅供参考。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Document, ChatDotRound, Monitor, Key, Share } from '@element-plus/icons-vue'
import request from '@/utils/request'

const userStore = useUserStore()
const pieChart = ref<HTMLElement>()
const barChart = ref<HTMLElement>()
const activePlatform = ref('deepseek')
const tabFilter = ref('all')
const keywordData = ref<any[]>([])
const reportData = ref<any>(null)

const platforms = ['deepseek', '豆包', '元宝', '千问', '文心', '纳米', 'kimi', '智谱']

const kpiData = ref([
  { label: '问题总量', value: 0, desc: 'AI拓展问题数量', bg: 'linear-gradient(135deg, #667eea, #764ba2)', icon: markRaw(Document) },
  { label: '收录总量', value: 0, desc: '八大平台收录量', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', icon: markRaw(ChatDotRound) },
  { label: '训练平台', value: 8, desc: '训练平台数量', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', icon: markRaw(Monitor) },
  { label: '蒸馏词', value: 0, desc: '主训练词数量', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', icon: markRaw(Key) },
])

async function loadReport() {
  try {
    const data = await request.get('/data/report')
    reportData.value = data
    kpiData.value[0].value = data.kpi.totalQuestions
    kpiData.value[1].value = data.kpi.totalIndexed
    kpiData.value[2].value = data.kpi.platforms
    kpiData.value[3].value = data.kpi.distillWords
    keywordData.value = data.keywords || []
    initCharts(data.platformData || [])
  } catch {}
}

function initCharts(platformData: any[]) {
  if (pieChart.value) {
    const chart = echarts.init(pieChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        type: 'pie', radius: ['40%', '70%'], label: { show: false },
        data: platformData.map(p => ({ name: p.name, value: p.indexed })),
      }],
    })
    window.addEventListener('resize', () => chart.resize())
  }

  if (barChart.value) {
    const chart = echarts.init(barChart.value)
    const total = platformData.reduce((s, p) => s + p.indexed, 0)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: ['已收录', '未收录'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [total, 0], barWidth: 40, itemStyle: { color: '#7c3aed', borderRadius: [4, 4, 0, 0] } }],
    })
    window.addEventListener('resize', () => chart.resize())
  }
}

onMounted(loadReport)
</script>

<style scoped lang="scss">
.report-header {
  background: linear-gradient(135deg, #2b1055, #4a1a7a);
  border-radius: 12px;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-content {
    h1 { color: #fff; font-size: 24px; margin-bottom: 4px; }
    p { color: rgba(255,255,255,0.7); font-size: 14px; }
  }
}
</style>
