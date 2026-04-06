<template>
  <div class="page-card">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <el-button type="primary" @click="$emit('add')">
            <el-icon><Plus /></el-icon>添加
          </el-button>
          <el-button @click="$emit('refresh')">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button type="danger" :disabled="!selectedRows.length" @click="$emit('batch-delete', selectedRows)">
            <el-icon><Delete /></el-icon>删除
          </el-button>
          <slot name="toolbar-extra" />
        </slot>
      </div>
      <div class="toolbar-right">
        <el-input v-if="searchable" v-model="searchText" placeholder="搜索..." clearable style="width: 200px" size="small" @clear="$emit('search', '')" @keyup.enter="$emit('search', searchText)">
          <template #append>
            <el-button @click="$emit('search', searchText)">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <el-button size="small" @click="$emit('export')">
          <el-icon><Download /></el-icon>
        </el-button>
      </div>
    </div>

    <slot name="alert" />

    <el-table
      :data="data"
      stripe
      v-loading="loading"
      @selection-change="handleSelectionChange"
      style="width: 100%"
    >
      <el-table-column type="selection" width="50" align="center" />
      <slot />
      <el-table-column label="操作" :width="actionWidth" align="center" fixed="right" v-if="showActions">
        <template #default="{ row }">
          <slot name="actions" :row="row">
            <el-button type="primary" link size="small" @click="$emit('edit', row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="danger" link size="small" @click="$emit('delete', row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="$emit('page-change', $event)"
        @size-change="$emit('size-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  data: any[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  searchable?: boolean
  showActions?: boolean
  actionWidth?: number
}>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,
  searchable: true,
  showActions: true,
  actionWidth: 120,
})

defineEmits(['add', 'edit', 'delete', 'batch-delete', 'refresh', 'search', 'export', 'page-change', 'size-change'])

const searchText = ref('')
const selectedRows = ref<any[]>([])
const currentPage = computed({
  get: () => props.page,
  set: () => {},
})
const currentPageSize = computed({
  get: () => props.pageSize,
  set: () => {},
})

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}
</script>

<style scoped lang="scss">
.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
