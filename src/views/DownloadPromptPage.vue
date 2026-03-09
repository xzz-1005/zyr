<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apkInfo } from '../api/union'
import { isIOS, isHarmony } from '../utils/device'
import logoImg from '../assets/images/logo.png'

const router = useRouter()
/** 当前设备对应的 APK 下载链接，由 apk_info 接口按设备类型解析 */
const apkDownloadUrl = ref('')

function getApkInfoByDevice(data) {
  if (!data) return null
  if (isIOS()) return data.iosApkInfo
  if (isHarmony()) return data.harmonyApkInfo
  return data.androidApkInfo
}

onMounted(async () => {
  const token = localStorage.getItem('loginToken')
  const config = token ? { headers: { Authorization: token } } : undefined
  try {
    const res = await apkInfo({}, config)
    const data = res?.data ?? res
    const info = getApkInfoByDevice(data)
    if (info?.apkDownloadUrl) {
      apkDownloadUrl.value = info.apkDownloadUrl
    }
  } catch (err) {
    console.error('apk_info error', err)
  }
})

const onDownload = () => {
  if (apkDownloadUrl.value) {
    window.location.href = apkDownloadUrl.value
  }
}

const onOpen = () => {
  // 打开 APP 或 scheme，按实际配置替换
  // window.location.href = 'zhyr://open'
}
</script>

<template>
  <div class="download-page">
    <div class="download-page__content">
      <div class="app-icon-wrap">
        <img :src="logoImg" alt="指易融" class="app-icon" />
      </div>
      <h1 class="title">指易融</h1>
      <p class="subtitle">让金融更容易</p>
      <div class="actions">
        <van-button type="primary" block round class="action-btn action-btn--primary" @click="onDownload">
          下载指易融APP
        </van-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.download-page {
  min-height: 100vh;
  // todo: 背景图
  background: linear-gradient(180deg, #e8f4ff 0%, #d6ebff 50%, #e3f1ff 100%);
  position: relative;
  overflow: hidden;
}

.download-page__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 110px;
  min-height: 100vh;
}

.app-icon-wrap {
  width: 88px;
  height: 88px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(25, 137, 250, 0.25);
  margin-bottom: 28px;
}

.app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #323233;
}

.subtitle {
  margin: 0 0 126px;
  font-size: 14px;
  color: #969799;
}

.actions {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-btn {
  height: 48px;
  font-size: 16px;

  &--primary {
    background: #1989fa;
    border: none;
  }

  &--outline {
    background: #fff;
    color: #1989fa;
    border: 1px solid #1989fa;
  }
}
</style>
