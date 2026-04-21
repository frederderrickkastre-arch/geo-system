<template>
  <el-dialog v-model="visible" title="账户充值" width="460px" @close="reset">
    <el-radio-group v-model="kind" style="margin-bottom: 16px">
      <el-radio-button value="balance">充值余额 (¥)</el-radio-button>
      <el-radio-button value="points">充值点数</el-radio-button>
    </el-radio-group>

    <el-form label-width="90px">
      <el-form-item label="金额">
        <el-input-number v-model="amount" :min="1" :max="100000" :step="kind === 'balance' ? 100 : 1000" />
        <span style="margin-left: 8px; color: #909399; font-size: 12px">
          {{ kind === 'balance' ? '元' : '点' }}
        </span>
      </el-form-item>
      <el-form-item label="快速选择">
        <el-button size="small" v-for="v in quickValues" :key="v" @click="amount = v">
          {{ kind === 'balance' ? '¥' : '' }}{{ v }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="notice">
      <el-icon><InfoFilled /></el-icon>
      <span>当前为演示模式：充值立即到账，生产环境将对接微信支付 / 支付宝回调。</span>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">立即充值</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const visible = defineModel<boolean>({ default: false })
const userStore = useUserStore()

const kind = ref<'balance' | 'points'>('balance')
const amount = ref(100)
const saving = ref(false)

const quickValues = computed(() => (kind.value === 'balance' ? [100, 500, 1000, 5000] : [1000, 5000, 10000, 50000]))

function reset() {
  kind.value = 'balance'
  amount.value = 100
}

async function handleSubmit() {
  if (!amount.value || amount.value <= 0) {
    ElMessage.warning('请输入金额')
    return
  }
  saving.value = true
  try {
    const data = await request.post('/user/recharge', { amount: amount.value, kind: kind.value })
    ElMessage.success(`充值成功，${kind.value === 'balance' ? '余额' : '点数'}已到账`)
    visible.value = false
    // 刷新用户信息
    try {
      const profile = await request.get('/user/profile')
      userStore.setUserInfo({
        id: profile.id,
        username: profile.username,
        nickname: profile.nickname,
        avatar: profile.avatar,
        vipExpiry: profile.vipExpiry,
        balance: profile.balance,
        points: profile.points,
      })
    } catch {}
    void data
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.notice {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 12px;
}
</style>
