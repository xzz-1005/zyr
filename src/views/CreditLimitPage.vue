<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { areaList } from '@vant/area-data'
import { unionLogin } from '../api/union'
import homeBg from '../assets/images/home-bg.png'

const router = useRouter()
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
const areaRef = ref(null)
/** 仅当因未选城市点击主按钮而打开弹层时为 true，用于显示「跳过」和「保存并提交」 */
const areaPopupFromCta = ref(false)

const toggleAsset = (value) => {
  const isNone = value === 'none'
  const idx = assets.value.indexOf(value)
  if (isNone) {
    assets.value = idx === -1 ? ['none'] : []
  } else {
    let next = assets.value.filter((v) => v !== 'none')
    if (idx === -1) {
      next = [...next, value]
    } else {
      next = next.filter((v) => v !== value)
    }
    assets.value = next
  }
}

const showCityPicker = () => {
  areaPopupFromCta.value = false
  showAreaPicker.value = true
}

const onAreaConfirm = ({ selectedOptions }) => {
  cityText.value = selectedOptions.map((o) => o.text).join(' ')
  showAreaPicker.value = false
}

const onSkipArea = () => {
  showAreaPicker.value = false;
  router.push('/download')
}

const onSaveAndSubmit = () => {
  const options = areaRef.value?.getSelectedOptions?.()
  if (options?.length) {
    cityText.value = options.map((o) => o.text).join(' ')
  }
  showAreaPicker.value = false
}

const unionLoginParams = {
  productCode: 'PRODUCT1',
  encryptParam: '16235487455',
}

const handleViewLimit = () => {
  if (!cityText.value) {
    areaPopupFromCta.value = true
    showAreaPicker.value = true
    return
  }
  // 前置逻辑：埋点、提交表单等
  router.push('/download')
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
  <div class="page" :style="{ backgroundImage: `url(${homeBg})` }">
    <!-- 顶部蓝色祝贺条 -->
    <div class="header-bar">
      <span class="header-text">恭喜你! 成为指易融优质用户</span>
    </div>

    <div class="content">
      <!-- 预估最高综合额度卡片 -->
      <div class="card estimate-card">
        <div class="estimate-card-header">
          <div class="estimate-card-header-title">指易融</div>
          <div class="estimate-card-header-divider"></div>
          <div class="estimate-card-header-subtitle">让金融更简单</div>
        </div>
        <div class="estimate-title">预估最高综合额度(元)</div>
        <div class="estimate-sub">（实际以最终审批结果为准）</div>
        <div class="estimate-amount">200,000</div>
        <div class="estimate-desc">
          年化综合融资成本（单利）5%-24% 借1万用1年日均息费0.8元起
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
      <van-button type="primary" block round class="cta-btn" @click="handleViewLimit">
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
        ref="areaRef"
        title="选择常驻省份"
        :area-list="areaList"
        :columns-num="2"
        @confirm="onAreaConfirm"
        @cancel="showAreaPicker = false"
      >
        <template v-if="areaPopupFromCta" #confirm>
          <span @click="onSkipArea">跳过</span>
        </template>
      </van-area>
      <van-button v-if="areaPopupFromCta" type="primary" block round class="area-submit-btn" @click="onSaveAndSubmit">
        保存并提交
      </van-button>
    </van-popup>
  </div>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
}

.header-bar {
  color: #fff;
  text-align: center;
  padding: 16px 0;
  font-size: 20px;

  .header-text {
    line-height: 26px;
  }
}

.content {
  padding: 0 16px;
}

.card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.estimate-card {
  text-align: center;

  .estimate-card-header {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    height: 36px;
    background-color: #e5f2ff;
    border-radius: 12px 12px 0 0;
  }

  .estimate-card-header-title {
    font-size: 14px;
    font-weight: 600;
    color: #056EEA;
  }

  .estimate-card-header-divider {
    width: 1px;
    height: 16px;
    background: #056EEA;
    margin: 0 8px;
  }

  .estimate-card-header-subtitle {
    font-size: 12px;
    color: #056EEA;
  }
}

.estimate-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #323233;
  margin-bottom: 1px;
  margin-top: 16px;
}

.estimate-sub {
  font-size: 10px;
  color: #BEC0C2;
  line-height: 20px;
}

.estimate-amount {
  font-size: 56px;
  font-weight: 700;
  color: #323233;
  line-height: 56px;
  margin-bottom: 7px;
}

.estimate-desc {
  font-size: 10px;
  color: #BEC0C2;
  line-height: 20px;
  padding-bottom: 20px;
}

.info-card {
  padding: 12px;
}

.info-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333E5;
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

.area-submit-btn {
  margin: 16px;
  margin-top: 0;
  height: 44px;
  font-size: 15px;
  width: calc(100% - 32px);
}
</style>
