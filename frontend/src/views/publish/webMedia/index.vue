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
        <el-input v-model="searchText" placeholder="搜索媒体名称" style="width: 250px" clearable />
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="page-card">
      <div class="media-card" v-for="item in mediaList" :key="item.id">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <div style="font-size: 15px; font-weight: 600; color: #303133">{{ item.name }}</div>
            <a href="#" style="font-size: 12px; color: #409eff; text-decoration: none">案例</a>
            <div style="margin-top: 6px"><el-tag v-for="tag in (item.tags || [])" :key="tag" size="small" style="margin-right: 4px">{{ tag }}</el-tag></div>
          </el-col>
          <el-col :span="4" class="stat-col">
            <div class="stat-item">
              <span class="stat-label">PC权重</span>
              <el-tag type="warning" size="small" round>{{ item.pc_weight }}</el-tag>
            </div>
            <div class="stat-item">
              <span class="stat-label">移动权重</span>
              <el-tag type="success" size="small" round>{{ item.mobile_weight }}</el-tag>
            </div>
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
        <div v-if="item.notes" style="margin-top: 8px; font-size: 12px; color: #909399; background: #fafafa; padding: 8px; border-radius: 4px">备注：{{ item.notes }}</div>
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

const searchText = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filters = reactive([
  { label: '行业领域', selected: '全部', options: ['IT科技', '游戏网站', '财经商业', '汽车网站', '娱乐休闲', '新闻资讯', '健康医疗', '房产家居', '教育培训', '食品餐饮', '区块链'] },
  { label: '综合门户', selected: '全部', options: ['腾讯网', '新浪网', '网易网', '搜狐网', '凤凰网', '人民网', '央视网', '新华网', '环球网'] },
  { label: '所在地区', selected: '全部', options: ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '山东', '福建', '湖南'] },
  { label: '入口级别', selected: '全部', options: ['没有入口', '首页入口', '频道入口', '上级入口'] },
  { label: '收录情况', selected: '全部', options: ['不包网页收录', '包网页收录', '不包资讯收录', '包资讯收录'] },
  { label: '链接类型', selected: '全部', options: ['不可带网址', '可带网址'] },
  { label: '发稿速度', selected: '全部', options: ['1小时', '2小时', '12小时', '当日', '次日', '48小时以上'] },
  { label: '特殊行业', selected: '全部', options: ['金融', '微商', '留学', '医疗', '加盟'] },
  { label: '高级选项', selected: '全部', options: ['周末可发', '节日可发', '晚上可发', '白名单来源', '可带视频', '可发GEO排名'] },
])

const mediaList = ref<any[]>([])

async function loadData() {
  try {
    const data = await request.get('/media/web', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    mediaList.value = data.list
    total.value = data.total
  } catch {}
}

function resetFilters() { filters.forEach(f => f.selected = '全部'); searchText.value = '' }

function handleSubmit(item: any) {
  request.post('/media/submit', { mediaType: 'web', mediaId: item.id, mediaName: item.name, price: item.price }).then(() => {
    ElMessage.success(`已向「${item.name}」提交投稿请求`)
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.stat-col { display: flex; flex-direction: column; gap: 4px; }
.stat-item { font-size: 13px; display: flex; align-items: center; gap: 6px; }
.stat-label { color: #909399; font-size: 12px; }
</style>
