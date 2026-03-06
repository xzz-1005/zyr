<script setup>
import { ref, onMounted } from 'vue'
import { areaList } from '@vant/area-data'
import { unionLogin } from '../api/union'

const activeTab = ref(0)
const assets = ref([])
const assetOptions = [
  { label: '有车', value: 'car' },
  { label: '有房', value: 'house' },
  { label: '有企业', value: 'business' },
  { label: '有公积金', value: 'fund' },
  { label: '有商业险', value: 'insurance' },
  { label: '以上均不是', value: 'none' },
]
const cityText = ref('')
const showAreaPicker = ref(false)

const toggleAsset = (value) => {
  const idx = assets.value.indexOf(value)
  if (idx === -1) {
    assets.value = [...assets.value, value]
  } else {
    assets.value = assets.value.filter((v) => v !== value)
  }
}

const showCityPicker = () => {
  showAreaPicker.value = true
}

const onAreaConfirm = ({ selectedOptions }) => {
  cityText.value = selectedOptions.map((o) => o.text).join(' ')
  showAreaPicker.value = false
}

const unionLoginParams = {
  productCode: 'PRODUCT1',
  encryptParam: '16235487455',
}

onMounted(() => {
  unionLogin(unionLoginParams)
    .then((res) => {
      console.log('union_login success', res)
    })
    .catch((err) => {
      console.error('union_login error', err)
    })
})
</script>

<template>
  <div class="page">
    <!-- 顶部蓝色祝贺条 -->
    <div class="header-bar">
      <span class="header-text">恭喜你! 成为指易融优质用户</span>
    </div>

    <!-- 指易融 | 让金融更 -->
    <van-tabs v-model:active="activeTab" class="main-tabs" shrink>
      <van-tab title="指易融" />
      <van-tab title="让金融更" />
    </van-tabs>

    <div class="content">
      <!-- 预估最高综合额度卡片 -->
      <div class="card estimate-card">
        <div class="estimate-title">预估最高综合额度(元)</div>
        <div class="estimate-sub">(预估总额已包含手续费)</div>
        <div class="estimate-amount">200,000</div>
        <div class="estimate-desc">
          年化综合借款成本（率）5%~24% 借1万元每日息费0.8元起
        </div>
      </div>

      <!-- 提额信息卡片 -->
      <div class="card info-card">
        <div class="card-title">提额信息 <span class="optional">(选填, 获取更高额度)</span></div>

        <div class="section">
          <div class="section-label">
            资产情况
            <span class="multi-hint">(可多选)</span>
          </div>
          <div class="asset-tags">
            <van-tag
              v-for="opt in assetOptions"
              :key="opt.value"
              :type="assets.includes(opt.value) ? 'primary' : 'default'"
              class="asset-tag"
              :class="{ 'asset-tag--selected': assets.includes(opt.value) }"
              @click="toggleAsset(opt.value)"
            >
              {{ opt.label }}
            </van-tag>
          </div>
        </div>

        <van-cell
          title="常驻城市"
          :value="cityText || '请选择所在省市'"
          is-link
          :value-class="cityText ? '' : 'placeholder'"
          @click="showCityPicker"
        />
      </div>

      <!-- 主按钮 -->
      <van-button type="primary" block round class="cta-btn">
        点击查看您的专属额度
      </van-button>

      <!-- 温馨提示 -->
      <div class="disclaimer">
        温馨提示:未经您的许可,本平台不会对您的个人信息进行任何处理。请谨慎第三方短信、电话诈骗、确保您的私密资金安全。
      </div>
    </div>

    <!-- 省市区选择 -->
    <van-popup v-model:show="showAreaPicker" position="bottom" round>
      <van-area
        title="选择省市区"
        :area-list="areaList"
        @confirm="onAreaConfirm"
        @cancel="showAreaPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 32px;
}

.header-bar {
  background: #1989fa;
  color: #fff;
  text-align: center;
  padding: 14px 16px;
  font-size: 15px;
}

.main-tabs {
  background: #e8f4ff;
}

.main-tabs :deep(.van-tabs__wrap) {
  height: 44px;
}

.main-tabs :deep(.van-tab) {
  font-size: 15px;
}

.main-tabs :deep(.van-tabs__line) {
  background: #1989fa;
}

.main-tabs :deep(.van-tabs__nav--line) {
  padding-bottom: 0;
}

.content {
  padding: 12px 16px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.estimate-card {
  text-align: center;
}

.estimate-title {
  font-size: 15px;
  color: #323233;
  margin-bottom: 4px;
}

.estimate-sub {
  font-size: 12px;
  color: #969799;
  margin-bottom: 16px;
}

.estimate-amount {
  font-size: 36px;
  font-weight: 600;
  color: #323233;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.estimate-desc {
  font-size: 12px;
  color: #969799;
  line-height: 1.5;
}

.info-card .card-title {
  font-size: 15px;
  color: #323233;
  margin-bottom: 16px;
}

.optional {
  font-size: 12px;
  color: #969799;
  font-weight: 400;
}

.section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 14px;
  color: #323233;
  margin-bottom: 10px;
}

.multi-hint {
  font-size: 12px;
  color: #1989fa;
  margin-left: 4px;
}

.asset-tags {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 12px;
}

.asset-tags :deep(.van-tag) {
  cursor: pointer;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  margin: 0;
  border: none;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.asset-tags :deep(.van-tag.van-tag--default) {
  background: #f7f8fa;
  color: #646566;
}

.asset-tags :deep(.van-tag.asset-tag--selected),
.asset-tags :deep(.van-tag.van-tag--primary) {
  background: #ecf9ff;
  color: #1989fa;
}

.info-card :deep(.van-cell) {
  padding: 12px 0;
}

.info-card :deep(.van-cell::after) {
  display: none;
}

.placeholder {
  color: #c8c9cc !important;
}

.cta-btn {
  margin-top: 24px;
  height: 48px;
  font-size: 16px;
}

.disclaimer {
  margin-top: 20px;
  padding: 0 4px;
  font-size: 11px;
  color: #969799;
  line-height: 1.6;
}
</style>
