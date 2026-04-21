<template>
  <el-tag :type="tagType" size="small">{{ tagText }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const MAP: Record<string, { type: string; text: string }> = {
  pending: { type: 'warning', text: '待审核' },
  running: { type: 'warning', text: '发布中' },
  published: { type: 'success', text: '已发布' },
  completed: { type: 'success', text: '已完成' },
  rejected: { type: 'danger', text: '已拒绝' },
  failed: { type: 'danger', text: '失败' },
  draft: { type: 'info', text: '草稿' },
  indexed: { type: 'success', text: '已收录' },
  none: { type: 'danger', text: '未收录' },
  active: { type: 'success', text: '正常' },
  inactive: { type: 'info', text: '暂停' },
  online: { type: 'success', text: '在线' },
  offline: { type: 'danger', text: '离线' },
  approved: { type: 'success', text: '已通过' },
}

const tagType = computed(() => (MAP[props.status]?.type as any) || 'info')
const tagText = computed(() => MAP[props.status]?.text || props.status || '-')
</script>
