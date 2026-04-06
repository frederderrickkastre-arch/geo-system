<template>
  <div class="page-container">
    <!-- Quotas -->
    <div class="page-card" style="margin-bottom: 16px">
      <h3 style="margin-bottom: 20px">账号权益</h3>
      <el-row :gutter="12">
        <el-col :span="6" v-for="item in quotas" :key="item.label" style="margin-bottom: 12px">
          <div class="quota-card" :style="{ background: item.bg }">
            <div class="quota-value">{{ item.value }}</div>
            <div class="quota-label">{{ item.label }}</div>
            <div class="quota-unit">{{ item.unit }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- AI Model Indexing -->
    <div class="page-card">
      <h3 style="margin-bottom: 20px">模型收录</h3>
      <el-row :gutter="12">
        <el-col :span="6" v-for="model in aiModels" :key="model.name" style="margin-bottom: 12px">
          <div class="model-card">
            <div class="model-icon" :style="{ background: model.color }">
              {{ model.name[0] }}
            </div>
            <div class="model-info">
              <div class="model-name">{{ model.name }}</div>
              <div class="model-count">{{ model.count }} 收录</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const bgColors = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
  'linear-gradient(135deg, #fdcbf1, #e6dee9)',
]

const modelColors = ['#4f46e5', '#0ea5e9', '#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

const quotas = ref<any[]>([])
const aiModels = ref<any[]>([])

async function loadBenefits() {
  try {
    const data = await request.get('/user/benefits')
    const q = data.quotas
    quotas.value = [
      { label: '主关键词', value: `${q.keywords.used}/${q.keywords.total}`, unit: '个', bg: bgColors[0] },
      { label: '写作问题', value: `${q.questions.used}/${q.questions.total}`, unit: '条', bg: bgColors[1] },
      { label: '已收录', value: `${q.indexed}`, unit: '条', bg: bgColors[2] },
      { label: 'AI写作数量', value: `${q.aiWriting.used}/${q.aiWriting.total}`, unit: '篇', bg: bgColors[3] },
      { label: '文章发布', value: `${q.publishing.used}/${q.publishing.total}`, unit: '次', bg: bgColors[4] },
      { label: '自媒体授权', value: `${q.mediaAuth.used}/${q.mediaAuth.total}`, unit: '个', bg: bgColors[5] },
      { label: '账号有效期', value: q.vipExpiry || '-', unit: '', bg: bgColors[6] },
      { label: '剩余余额', value: (q.balance || 0).toFixed(2), unit: '元', bg: bgColors[7] },
    ]
    aiModels.value = (data.aiModels || []).map((m: any, i: number) => ({ ...m, color: modelColors[i % modelColors.length] }))
  } catch {}
}

onMounted(loadBenefits)
</script>

<style scoped lang="scss">
.quota-card {
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  color: #fff;
  min-height: 100px;

  .quota-value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .quota-label {
    font-size: 13px;
    opacity: 0.9;
  }

  .quota-unit {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 2px;
  }
}

.model-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fe;
  border-radius: 10px;

  .model-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .model-name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .model-count {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}
</style>
