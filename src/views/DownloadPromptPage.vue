<script setup>
import { apkInfo } from '@/api/union'
import { isIOS, isHarmony, getPhoneBrand } from '@/utils/device'
import logoImg from '@/assets/images/logo.png'
import downloadBg from '@/assets/images/download-bg.png'
import { showToast } from 'vant'

function getApkInfoByDevice() {
  if (isIOS()) return 'ios'
  if (isHarmony()) return 'harmonyos'
  return 'android'
}

async function onDownload() {
  try {
    const params = {
      systemType: getApkInfoByDevice(),
      brandType: getPhoneBrand()
    }
    const res = await apkInfo(params)
    if (res?.code != '000000') {
      showToast({
        message: res?.msg,
        position: 'top',
        style: {
          top: '20px',
        },
      })
      return
    }
    const data = res?.data ?? res
    console.log('onDownload=====', document.visibilityState)
    if (data.appLaunchFlag) {
      if (!data.appMarketUrl) { showToast('未找到该应用'); return }
      window.location.href = data.appMarketUrl
    } else {
      if (!data.apkDownloadUrl) { showToast('下载app失败'); return }
      window.location.href = data.apkDownloadUrl
    }
    console.log('Market=====', data.appMarketUrl, 'apk=====', data.apkDownloadUrl)
  } catch (err) {
    console.error('apk_info error', err)
  }
}

const onOpen = () => {
  // 打开 APP 或 scheme，按实际配置替换
  // window.location.href = 'zhyr://open'
}
</script>

<template>
  <div class="download-page" :style="{ backgroundImage: `url(${downloadBg})` }">
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
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
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
  margin-bottom: 17px;
}

.app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  margin: 0 0 12px;
  font-size: 29px;
  font-weight: 600;
  color: #333333;
}

.subtitle {
  margin: 0 0 126px;
  font-size: 16px;
  color: #333333;
  letter-spacing: 9px;
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
