<template>
  <div class="page-container">
    <div class="page-card">
      <h3 style="margin-bottom: 20px">查询关键词在AI平台的收录情况</h3>
      <el-form :inline="true">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="请输入关键词" style="width: 300px" />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="platform" style="width: 180px">
            <el-option v-for="p in platforms" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div v-if="queryResult" style="margin-top: 20px">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="关键词">{{ queryResult.keyword }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ queryResult.platform }}</el-descriptions-item>
          <el-descriptions-item label="收录状态">
            <el-tag :type="queryResult.indexed ? 'success' : 'danger'">{{ queryResult.indexed ? '已收录' : '未收录' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="查询时间">{{ queryResult.queryTime }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 16px; background: #f5f7fa; border-radius: 8px; padding: 40px; text-align: center; color: #909399">
          查询截图区域
        </div>
      </div>
      <el-empty v-else description="输入关键词开始查询" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const keyword = ref('')
const platform = ref('deepseek')
const loading = ref(false)
const platforms = ['deepseek', '豆包', '元宝', '千问', '文心', '纳米', 'kimi', '智谱']
const queryResult = ref<any>(null)

async function handleQuery() {
  if (!keyword.value) { ElMessage.warning('请输入关键词'); return }
  loading.value = true
  try {
    const data = await request.post('/data/query', { keyword: keyword.value, platform: platform.value })
    queryResult.value = data
  } finally {
    loading.value = false
  }
}
</script>
