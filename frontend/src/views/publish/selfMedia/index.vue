<template>
  <div class="page-container">
    <div class="page-card" style="margin-bottom: 16px">
      <div class="filter-section" v-for="filter in filters" :key="filter.label">
        <span class="filter-label">{{ filter.label }}：</span>
        <div class="filter-tags">
          <span class="filter-tag" :class="{ active: filter.selected === '全部' }" @click="filter.selected = '全部'">全部</span>
          <span class="filter-tag" v-for="tag in filter.options" :key="tag" :class="{ active: filter.selected === tag }" @click="filter.selected = tag">{{ tag }}</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px">
        <el-input v-model="searchText" placeholder="搜索账号名称" style="width: 250px" clearable />
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="page-card">
      <div class="media-card" v-for="item in mediaList" :key="item.id">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <div style="font-size: 15px; font-weight: 600; color: #303133">{{ item.name }}</div>
            <el-tag size="small" type="info" style="margin-top: 4px">{{ item.platform }}</el-tag>
            <el-tag v-if="item.verified" size="small" type="warning" style="margin-left: 4px">已认证</el-tag>
          </el-col>
          <el-col :span="4">
            <div class="stat-item"><span class="stat-label">行业</span><span>{{ item.industry }}</span></div>
            <div class="stat-item"><span class="stat-label">粉丝</span><span>{{ item.followers }}</span></div>
          </el-col>
          <el-col :span="4">
            <div class="stat-item"><span class="stat-label">发稿时间</span><span>{{ item.publish_time }}</span></div>
          </el-col>
          <el-col :span="3">
            <div class="stat-item"><span class="stat-label">出稿率</span><span style="color: #67c23a; font-weight: 600">{{ item.success_rate }}%</span></div>
          </el-col>
          <el-col :span="3">
            <div style="font-size: 20px; font-weight: 700; color: #f56c6c">¥{{ item.price }}</div>
          </el-col>
          <el-col :span="4" style="text-align: right">
            <el-button type="primary" @click="handleSubmit(item)">投稿</el-button>
          </el-col>
        </el-row>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="total, prev, pager, next, jumper" @current-change="loadData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const searchText = ref(''); const page = ref(1); const pageSize = ref(10); const total = ref(0)

const filters = reactive([
  { label: '平台', selected: '全部', options: ['今日头条', '百家号', '新浪号', '网易号', '腾讯号', '知乎号', '微博', '搜狐网', '小红书', '哔哩哔哩', '微信公众号'] },
  { label: '行业', selected: '全部', options: ['文化', '健康', '财经', '科技', '汽车', '娱乐', '教育', '美食', '旅游', '房产', '生活'] },
  { label: '所在地区', selected: '全部', options: ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '山东'] },
  { label: '粉丝量', selected: '全部', options: ['0-1000', '1000-1万', '1万-10万', '10万-50万', '50万-100万', '100万+'] },
  { label: '其他', selected: '全部', options: ['可发视频', '周末可发', '节假日可发', '黄V认证', '秒出稿', '可发GEO排名'] },
])

const mediaList = ref<any[]>([])

async function loadData() {
  try {
    const data = await request.get('/media/self', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    mediaList.value = data.list; total.value = data.total
  } catch {}
}

function resetFilters() { filters.forEach(f => f.selected = '全部'); searchText.value = '' }

function handleSubmit(item: any) {
  request.post('/media/submit', { mediaType: 'self', mediaId: item.id, mediaName: item.name, price: item.price }).then(() => {
    ElMessage.success(`已向「${item.name}」提交投稿请求`)
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.stat-item { font-size: 13px; display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.stat-label { color: #909399; font-size: 12px; }
</style>
