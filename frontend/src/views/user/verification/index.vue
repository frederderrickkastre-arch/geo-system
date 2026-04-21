<template>
  <div class="page-container">
    <div class="page-card verification-card">
      <template v-if="verified">
        <el-icon :size="64" color="#67c23a"><CircleCheckFilled /></el-icon>
        <h2 class="title">实名认证 <el-tag type="success">已认证</el-tag></h2>
        <p class="desc">您已完成实名认证，可正常使用系统全部功能。</p>
        <el-descriptions :column="1" border style="margin-top: 24px; text-align: left">
          <el-descriptions-item label="真实姓名">{{ maskName(realName) }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ maskIdCard(idCard) }}</el-descriptions-item>
          <el-descriptions-item label="认证时间">{{ reviewedAt || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <template v-else>
        <el-icon :size="56" color="#e6a23c"><WarningFilled /></el-icon>
        <h2 class="title">实名认证</h2>
        <p class="desc">为了确保您能正常、稳定地使用系统全部功能，请尽快完成实名认证。</p>
        <el-alert
          v-if="verifyRequest?.status === 'rejected'"
          type="error"
          :title="`上次认证被驳回：${verifyRequest.reject_reason || '资料不完整'}`"
          :closable="false"
          show-icon
          style="margin: 16px 0"
        />
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="margin-top: 24px; text-align: left">
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="form.realName" placeholder="请输入真实姓名" maxlength="30" />
          </el-form-item>
          <el-form-item label="身份证号" prop="idCard">
            <el-input v-model="form.idCard" placeholder="18 位身份证号" maxlength="18" />
          </el-form-item>
          <el-form-item label="身份证人像面">
            <el-upload
              action="/api/upload/image"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="(r: any) => (form.idFront = r?.data?.url || '')"
            >
              <el-button plain><el-icon><UploadFilled /></el-icon>上传人像面</el-button>
            </el-upload>
            <el-image v-if="form.idFront" :src="form.idFront" style="width: 120px; height: 80px; margin-left: 12px; border-radius: 4px" fit="cover" />
          </el-form-item>
          <el-form-item label="身份证国徽面">
            <el-upload
              action="/api/upload/image"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="(r: any) => (form.idBack = r?.data?.url || '')"
            >
              <el-button plain><el-icon><UploadFilled /></el-icon>上传国徽面</el-button>
            </el-upload>
            <el-image v-if="form.idBack" :src="form.idBack" style="width: 120px; height: 80px; margin-left: 12px; border-radius: 4px" fit="cover" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
              <el-icon><Postcard /></el-icon>提交认证
            </el-button>
          </el-form-item>
        </el-form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()


const verified = ref(false)
const realName = ref('')
const idCard = ref('')
const reviewedAt = ref('')
const verifyRequest = ref<any>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({ realName: '', idCard: '', idFront: '', idBack: '' })

const uploadHeaders = computed(() => (userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}))

const rules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { pattern: /^[一-龥·]{2,30}$/, message: '请输入 2-30 位中文姓名', trigger: 'blur' },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' },
  ],
}

async function loadData() {
  try {
    const data = await request.get('/user/verification')
    verified.value = !!data.verified
    realName.value = data.realName || ''
    verifyRequest.value = data.request
    idCard.value = data.request?.id_card || ''
    reviewedAt.value = data.request?.reviewed_at || ''
  } catch {}
}

async function handleSubmit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    await request.post('/user/verification', form)
    ElMessage.success('实名认证成功')
    await loadData()
  } finally {
    submitting.value = false
  }
}

function maskName(n: string) {
  if (!n) return '-'
  return n.length <= 1 ? n : n[0] + '*'.repeat(Math.max(1, n.length - 1))
}

function maskIdCard(c: string) {
  if (!c || c.length < 10) return '-'
  return c.slice(0, 4) + '**********' + c.slice(-4)
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.verification-card {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 32px;
  text-align: center;

  .title {
    margin: 16px 0 8px;
    color: #303133;
  }

  .desc {
    color: #909399;
    margin-bottom: 0;
  }
}
</style>
