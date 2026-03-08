<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
// import { useTrack } from '../composables/useTrack' // TODO: 添加埋点
import { areaList } from '@vant/area-data'
import { unionLogin, homePage } from '../api/union'
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
/** 前五项（有车/有房/有企业/有公积金/有商业险）的 value；仅当五项全选或选「以上均不是」时视为资产已选，否则点击提交会再弹出资产弹框 */
const FIVE_ASSET_VALUES = ['car', 'house', 'business', 'fund', 'insurance']

/** 某一项是否已“作答”：选了“有”或“无” */
const isAssetAnswered = (v) => assets.value.includes(v) || assets.value.includes('no_' + v)

const hasValidAssetSelection = () => {
  if (assets.value.includes('none')) return true
  return FIVE_ASSET_VALUES.every((v) => isAssetAnswered(v))
}

/** 第一步展示模式：打开弹框时确定，不随选择变化。'all'=六项全部，'single'=仅未选那一项的有/无 */
const assetPopupStep1Mode = ref('all')
/** 第一步为 single 时，未选中的那一项 option（打开时确定） */
const assetPopupStep1SingleOption = ref(null)

/** 第一步「保存并下一步」是否禁用：有/无模式需选其一，普通模式需至少选一项 */
const assetPopupStep1BtnDisabled = computed(() => {
  if (assetPopupStep1Mode.value === 'single' && assetPopupStep1SingleOption.value) {
    const opt = assetPopupStep1SingleOption.value
    return !assets.value.includes(opt.value) && !assets.value.includes('no_' + opt.value)
  }
  return assets.value.length === 0
})
const cityText = ref('')
const showAreaPicker = ref(false)
const areaRef = ref(null)
/** 仅当因未选城市点击主按钮而打开弹层时为 true，用于显示「跳过」和「保存并提交」 */
const areaPopupFromCta = ref(false)
/** 选择资产情况弹层（未选资产/未选城市时点击主按钮弹出），内部分两步 */
const showAssetPopup = ref(false)
/** 弹框内步骤：1=资产选择，2=城市选择 */
const assetPopupStep = ref(1)
/** 本次打开弹框是否会经历两步（从第一步进入则为 true，直接第二步则为 false，用于是否展示 dots） */
const assetPopupHasTwoSteps = ref(false)
const assetPopupAreaRef = ref(null)
/** 第二步是否有选中的省/市（用于「保存并提交」是否 disabled） */
const step2HasSelection = ref(false)
const estimateAmount = ref(200000)

const formatNumber = (num) => {
  return num.toLocaleString()
}

const toggleAsset = (value) => {
  const isNone = value === 'none'
  if (isNone) {
    const idx = assets.value.indexOf(value)
    assets.value = idx === -1 ? ['none'] : []
    return
  }
  const isNo = value.startsWith('no_')
  const base = isNo ? value.slice(3) : value
  let next = assets.value.filter((v) => v !== 'none')
  if (isNo) {
    next = next.filter((v) => v !== base)
    const idx = next.indexOf(value)
    if (idx === -1) next.push(value)
    else next = next.filter((v) => v !== value)
  } else {
    next = next.filter((v) => v !== 'no_' + base)
    const idx = next.indexOf(value)
    if (idx === -1) next.push(value)
    else next = next.filter((v) => v !== value)
  }
  assets.value = next
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
  encryptParam: '16235487455', // TODO: 参数从路由获取
}

const initLogin = async () => {
  try {
    const res = await unionLogin(unionLoginParams)
    const loginToken = res?.data?.loginToken
    if (loginToken) {
      const homeRes = await homePage(
        { productCode: 'PRODUCT1' },
        { headers: { Authorization: loginToken } }
      )
      console.log('home_page success', homeRes)
    }
  } catch (err) {
    console.error('union_login or home_page error', err)
  }
}
initLogin()

const openAssetPopupStep1 = () => {
  const unselected = FIVE_ASSET_VALUES.filter((v) => !isAssetAnswered(v))
  if (unselected.length === 1) {
    assetPopupStep1Mode.value = 'single'
    assetPopupStep1SingleOption.value = assetOptions.find((o) => o.value === unselected[0]) ?? null
  } else {
    assetPopupStep1Mode.value = 'all'
    assetPopupStep1SingleOption.value = null
  }
}

const handleViewLimit = () => {
  if (!hasValidAssetSelection()) {
    assetPopupStep.value = 1
    assetPopupHasTwoSteps.value = true
    openAssetPopupStep1()
    showAssetPopup.value = true
    return
  }
  if (!cityText.value) {
    assetPopupStep.value = 2
    assetPopupHasTwoSteps.value = false
    showAssetPopup.value = true
    return
  }
  router.push('/download')
}

const goAfterAssetPopup = () => {
  if (!cityText.value) {
    assetPopupStep.value = 2
  } else {
    showAssetPopup.value = false
    router.push('/download')
  }
}

const onSkipAsset = () => {
  goAfterAssetPopup()
}

const onSaveAndNextAsset = () => {
  goAfterAssetPopup()
}

const onSkipAssetStep2 = () => {
  showAssetPopup.value = false
  router.push('/download')
}

const onSaveAndSubmitAssetPopup = () => {
  const options = assetPopupAreaRef.value?.getSelectedOptions?.()
  if (options?.length) {
    cityText.value = options.map((o) => o.text).join(' ')
  }
  showAssetPopup.value = false
  router.push('/download')
}

const onStep2AreaChange = ({ selectedOptions }) => {
  step2HasSelection.value = selectedOptions?.length > 0
}

watch([showAssetPopup, assetPopupStep], ([show]) => {
  step2HasSelection.value = false
  if (!show) {
    assetPopupStep1Mode.value = 'all'
    assetPopupStep1SingleOption.value = null
  }
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
        <div class="estimate-amount">{{ formatNumber(estimateAmount) }}</div>
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

    <!-- 选择资产/城市 两步弹层：第一步资产，第二步城市 -->
    <van-popup v-model:show="showAssetPopup" position="bottom" round class="asset-popup">
      <div class="asset-popup__header">
        <span class="asset-popup__close" @click="showAssetPopup = false">×</span>
        <span class="asset-popup__title">{{ assetPopupStep === 1 ? '选择资产情况' : '选择常驻省份' }}</span>
        <span class="asset-popup__right">
          <span v-if="assetPopupStep === 1" class="asset-popup__skip" @click="onSkipAsset">跳过</span>
        </span>
      </div>
      <!-- 第一步：资产选择 -->
      <template v-if="assetPopupStep === 1">
        <div class="asset-popup__content">
          <div class="asset-popup__body">
            <div class="asset-popup__tags" :class="{ 'asset-popup__tags--single': assetPopupStep1Mode === 'single' }">
              <template v-if="assetPopupStep1Mode === 'single' && assetPopupStep1SingleOption">
                <van-tag
                  :type="assets.includes(assetPopupStep1SingleOption.value) ? 'primary' : 'default'"
                  class="asset-tag"
                  :class="{ 'asset-tag--selected': assets.includes(assetPopupStep1SingleOption.value) }"
                  @click="toggleAsset(assetPopupStep1SingleOption.value)"
                >
                  {{ assetPopupStep1SingleOption.label }}
                </van-tag>
                <van-tag
                  :type="assets.includes('no_' + assetPopupStep1SingleOption.value) ? 'primary' : 'default'"
                  class="asset-tag"
                  :class="{ 'asset-tag--selected': assets.includes('no_' + assetPopupStep1SingleOption.value) }"
                  @click="toggleAsset('no_' + assetPopupStep1SingleOption.value)"
                >
                  {{ '无' + assetPopupStep1SingleOption.label.slice(1) }}
                </van-tag>
              </template>
              <template v-else>
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
              </template>
            </div>
          </div>
        </div>
        <van-button
          type="primary"
          block
          round
          class="asset-popup__btn"
          :disabled="assetPopupStep1BtnDisabled"
          @click="onSaveAndNextAsset"
        >
          保存并下一步
        </van-button>
      </template>
      <!-- 第二步：城市选择 -->
      <template v-else>
        <div class="asset-popup__content">
          <div class="asset-popup__area-wrap">
            <van-area
              ref="assetPopupAreaRef"
              :area-list="areaList"
              :columns-num="2"
              @change="onStep2AreaChange"
            />
          </div>
        </div>
        <van-button
          type="primary"
          block
          round
          class="asset-popup__btn"
          :disabled="!step2HasSelection"
          @click="onSaveAndSubmitAssetPopup"
        >
          保存并提交
        </van-button>
      </template>
      <div v-if="assetPopupHasTwoSteps" class="asset-popup__dots">
        <span class="asset-popup__dot" :class="{ 'asset-popup__dot--active': assetPopupStep === 1 }" />
        <span class="asset-popup__dot" :class="{ 'asset-popup__dot--active': assetPopupStep === 2 }" />
      </div>
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

/* 选择资产情况弹层 */
.asset-popup {
  padding: 0 0 24px;
}

.asset-popup__header {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #ebedf0;
}

.asset-popup__close {
  font-size: 24px;
  color: #969799;
  line-height: 1;
  cursor: pointer;
  padding: 4px;
}

.asset-popup__title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  text-align: center;
  justify-self: center;
}

.asset-popup__right {
  text-align: right;
}

.asset-popup__skip {
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
}

.asset-popup__content {
  // height: 300px;
  // overflow: auto;
}

.asset-popup__body {
  padding: 20px 16px;
}

.asset-popup__tags {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 12px;
}

.asset-popup__tags--single {
  grid-template-columns: 1fr 1fr;
}

.asset-popup__tags :deep(.van-tag) {
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

.asset-popup__tags :deep(.van-tag.van-tag--default) {
  background: #f7f8fa;
  color: #646566;
}

.asset-popup__tags :deep(.van-tag.asset-tag--selected),
.asset-popup__tags :deep(.van-tag.van-tag--primary) {
  background: #ecf9ff;
  color: #1989fa;
}

.asset-popup__btn {
  width: calc(100% - 32px);
  margin: 0 16px;
  height: 44px;
  font-size: 15px;
  box-sizing: border-box;
}

.asset-popup__area-wrap {
  height: 100%;
  padding: 0 16px 8px;
  min-height: 260px;
}

.asset-popup__area-wrap :deep(.van-picker__toolbar) {
  display: none;
}

.asset-popup__dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
}

.asset-popup__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dcdee0;
}

.asset-popup__dot--active {
  background: #1989fa;
}
</style>
