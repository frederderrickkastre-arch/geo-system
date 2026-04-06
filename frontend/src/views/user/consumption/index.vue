<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="loadData">
      <el-tab-pane label="点数明细" name="points">
        <CrudTable :data="pointsData" :loading="loading" :total="pointsTotal" :page="pointsPage" :page-size="10"
          :show-actions="false" @refresh="loadData" @search="handleSearch"
          @page-change="pointsPage = $event; loadData()">
          <template #toolbar-left><el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button></template>
          <el-table-column prop="id" label="序号" width="80" align="center" />
          <el-table-column prop="project" label="项目" min-width="250" />
          <el-table-column prop="points" label="点数" width="120" align="center">
            <template #default="{ row }"><span :style="{ color: row.points > 0 ? '#67c23a' : '#f56c6c' }">{{ row.points > 0 ? '+' : '' }}{{ row.points }}</span></template>
          </el-table-column>
          <el-table-column prop="created_at" label="消耗时间" width="180" />
        </CrudTable>
      </el-tab-pane>
      <el-tab-pane label="余额明细" name="balance">
        <CrudTable :data="balanceData" :loading="loading" :total="balanceTotal" :page="balancePage" :page-size="10"
          :show-actions="false" @refresh="loadData" @search="handleSearch"
          @page-change="balancePage = $event; loadData()">
          <template #toolbar-left><el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button></template>
          <el-table-column prop="id" label="序号" width="80" align="center" />
          <el-table-column prop="project" label="项目" min-width="250" />
          <el-table-column prop="amount" label="金额" width="120" align="center">
            <template #default="{ row }"><span :style="{ color: parseFloat(row.amount) > 0 ? '#67c23a' : '#f56c6c' }">{{ parseFloat(row.amount) > 0 ? '+' : '' }}{{ parseFloat(row.amount).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column prop="balance" label="余额" width="120" align="center">
            <template #default="{ row }">{{ parseFloat(row.balance).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="变动时间" width="180" />
        </CrudTable>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const activeTab = ref('points')
const loading = ref(false)
const pointsData = ref<any[]>([])
const pointsTotal = ref(0)
const pointsPage = ref(1)
const balanceData = ref<any[]>([])
const balanceTotal = ref(0)
const balancePage = ref(1)

async function loadData() {
  loading.value = true
  try {
    if (activeTab.value === 'points') {
      const data = await request.get('/user/consumption/points', { params: { page: pointsPage.value, pageSize: 10 } })
      pointsData.value = data.list; pointsTotal.value = data.total
    } else {
      const data = await request.get('/user/consumption/balance', { params: { page: balancePage.value, pageSize: 10 } })
      balanceData.value = data.list; balanceTotal.value = data.total
    }
  } finally { loading.value = false }
}

function handleSearch() { loadData() }
onMounted(loadData)
</script>
