<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTrack } from '@/composables/useTrack'
import { unionLogin, homePage, saveAssetInfo, saveResidentInfo, saveSesameScoreInfo } from '@/api/union'
import { getResidentCity } from '@/api/common'
import homeBg from '@/assets/images/home-bg.png'
import vectorIcon from '@/assets/images/Vector.png'
import { formatAreaList } from '@/utils/common'
import { useRoute } from 'vue-router'
import { apkInfo } from '@/api/union'
import { isIOS, isHarmony, getPhoneBrand } from '@/utils/device'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const assets = ref([])
/** 资产选项，来自接口 increaseQuotaGrid.assetItemList，未返回时用默认 */
const assetOptions = ref([
  { label: '有车', value: 'car', noneLabel: '无车' },
  { label: '有房', value: 'house', noneLabel: '无房' },
  { label: '有企业', value: 'company', noneLabel: '无企业' },
  { label: '有公积金', value: 'gjj', noneLabel: '无公积金' },
  { label: '有商业险', value: 'insurance', noneLabel: '无商业险' },
  { label: '以上均不是', value: 'none', noneLabel: '以上均不是' },
])

const sesameScoreOptions = ref([
  { label: '700以上', value: '4' },
  { label: '650-700', value: '3' },
  { label: '600-650', value: '2' },
  { label: '小于600', value: '1' },
])
/** 需要作答的资产 value（多项时排除最后一项「以上均不是」，仅一项时即该项） */
const FIVE_ASSET_VALUES = computed(() =>
  assetOptions.value.length > 1
    ? assetOptions.value.slice(0, -1).map((o) => o.value)
    : assetOptions.value.map((o) => o.value)
)

/** 某一项是否已“作答”：选了“有”或“无” */
const isAssetAnswered = (v) => assets.value.includes(v) || assets.value.includes('no_' + v)

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
const cityObj = ref()
/** 已选常驻省市对应的接口参数，用于 handleViewLimit 时一并提交 */
const residentInfoPayload = ref(null)
const showAreaPicker = ref(false)
const areaRef = ref(null)
/** 首页 van-area v-model：末级城市 code（与 Vant Area 一致） */
const areaPickerCode = ref('')
/** 当前选择是否为默认「请选择」（用于右上角确认置灰） */
const areaSelectionIsDefault = ref(true)

/** 选择资产情况弹层（未选资产/未选城市时点击主按钮弹出），内部分两步 */
const showPopup = ref(false)

const popupAreaRef = ref(null)
/** 第二步是否有选中的省/市（用于「保存并提交」是否 disabled） */
const step2HasSelection = ref(false)

const estimateAmount = ref(200000)
/** 登录 token，来自接口 unionLogin.data.loginToken */
const loginToken = ref(null)
/** 额度标题，来自接口 homeQuotaGrid.title */
const estimateTitle = ref('预估最高综合可借(元)')
/** 额度说明，来自接口 homeQuotaGrid.tips */
const estimateTips = ref('年化综合资金成本（单利）5%～24%，借1万用1年日均息费0.8元起')
/** 是否需要选择资产，来自接口 needAssetInfo */
const needAssetInfo = ref(false)
/** 是否展示常驻省市，来自接口 needResidentInfo */
const needResidentInfo = ref(false)
/** 是否需要选择芝麻分，来自接口 needSesameScore */
const needSesameScore = ref(false)
const sesameScoreText = ref('')

const loading = ref(false)

const totalStepList = ref([]) //总步骤列表
const currentStep = ref() //当前步骤

const areaList = ref({
  province_list: {},
  city_list: {},
})

const formatNumber = (num) => {
  return num.toLocaleString()
}

const closePopup = () => {
  showPopup.value = false
  refreshPage()
}

const refreshPage = () => {
  assets.value = []
  sesameScoreText.value = ''
  cityText.value = ''
  cityObj.value = []
  areaPickerCode.value = ''
  areaSelectionIsDefault.value = true
  getHomePage()
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

const toggleSesameScore = (value) => {
  if (sesameScoreText.value.includes(value)) {
    sesameScoreText.value = ''
  } else {
    sesameScoreText.value = value
  }
}

const showCityPicker = async () => {
  showAreaPicker.value = true
  await nextTick()
  // 两列：省、市；modelValue 为市级 code
  const cityCode = cityObj.value?.[1]?.value
  if (cityCode != null && String(cityCode).trim() !== '') {
    areaPickerCode.value = String(cityCode).trim()
    areaSelectionIsDefault.value = !isAreaSelectionValid(cityObj.value)
  } else {
    areaPickerCode.value = ''
    areaSelectionIsDefault.value = true
  }
}

/** 判断省市区选择是否为有效选择（非占位「请选择」） */
const isAreaSelectionValid = (selectedOptions) => {
  if (!selectedOptions || selectedOptions.length < 2) return false
  const [p, c] = selectedOptions
  return !!(p?.text && p.text !== '请选择' && c?.text && c.text !== '请选择')
}

const onAreaChange = ({ selectedOptions }) => {
  areaSelectionIsDefault.value = !isAreaSelectionValid(selectedOptions)
}

const handleAreaConfirmClick = (e) => {
  if (areaSelectionIsDefault.value) {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    return
  }
  const options = areaRef.value?.getSelectedOptions?.() ?? []
  onAreaConfirm({ selectedOptions: options })
}

const onAreaConfirm = ({ selectedOptions }) => {
  const texts = selectedOptions.map((o) => o.text)
  cityText.value = texts.join(' ')
  cityObj.value = selectedOptions
  const city = selectedOptions[1]
  if (city?.value != null) {
    areaPickerCode.value = String(city.value)
  }
  showAreaPicker.value = false
}

const unionLoginParams = {
  encryptParam: route.query.encryptParam || '',
}
console.log('unionLoginParams=====', unionLoginParams, window.location.href)

const { track } = useTrack()

const initLogin = async () => {
  try {
    loading.value = true
    const res = await unionLogin(unionLoginParams)
    loginToken.value = res?.data?.loginToken
    track({
      eventType: 'result',
      sceneType: 'login',
      resultType: 'suc',
      dataInfoList: [
        {key: 'message', message: loginToken.value ? '登录成功(含注册)' : '登录失败'},
        {key: 'message3', message: res?.data?.firstLogin ? '注册并登录' : '仅登录'},
        {key: 'info5', message: window.location.href},
      ],
    })
    if (loginToken.value) {
      try {
        localStorage.setItem('loginToken', loginToken.value)
        localStorage.setItem('sourceAppCode', res?.data?.sourceAppCode)
      } catch (e) {
        // ignore
      }
      await getHomePage()
      residentCityFn()
    }
  } catch (err) {
    console.error('union_login or home_page error', err)
  } finally {
    loading.value = false
  }
}

const residentCityFn = async () => {
  try {
    const res = await getResidentCity()
    areaList.value = formatAreaList(res?.data?.provinceResponseVos || [])
  } catch (err) {
    console.error('get_resident_city error', err)
  }
}

const getHomePage = async () => {
  try {
    const homeRes = await homePage(
      {},
    )
    const homeQuota = homeRes?.data?.homeQuotaGrid
    if (homeQuota?.title) {
      estimateTitle.value = homeQuota.title
    }
    if (homeQuota?.tips) {
      estimateTips.value = homeQuota.tips
    }
    if (homeQuota?.quota != null) {
      estimateAmount.value = homeQuota.quota
    }
    const list = homeRes?.data?.increaseQuotaGrid?.assetItemList
    if (Array.isArray(list) && list.length) {
      assetOptions.value = list.map((item) => ({
        label: item.haveDesc,
        value: item.assetCode.toLowerCase(),
        noneLabel: item.noneDesc,
      }))
    }
    const sesameScoreList = homeRes?.data?.increaseQuotaGrid?.sesameScoreItemList
    if (Array.isArray(sesameScoreList) && sesameScoreList.length) {
      sesameScoreOptions.value = sesameScoreList.map((item) => ({
        label: item.displayDesc,
        value: item.sesameScoreCode,
      }))
    }
    if (homeRes?.data?.increaseQuotaGrid.needAssetInfo != null) {
      needAssetInfo.value = !!homeRes.data.increaseQuotaGrid.needAssetInfo
    }
    if (homeRes?.data?.increaseQuotaGrid.needResidentInfo != null) {
      needResidentInfo.value = !!homeRes.data.increaseQuotaGrid.needResidentInfo
    }
    if (homeRes?.data?.increaseQuotaGrid.needSesameScore != null) {
      needSesameScore.value = !!homeRes.data.increaseQuotaGrid.needSesameScore
    }
    // needAssetInfo.value = true // TODO: 测试用
    // needResidentInfo.value = true // TODO: 测试用
    // needSesameScore.value = true // TODO: 测试用
    const trackList = [
      {
        key: 'message',
        message: needAssetInfo.value || needResidentInfo.value || needSesameScore.value ? '有提额卡片' : '无提额卡片',
      },
    ]
    if (needAssetInfo.value || needResidentInfo.value || needSesameScore.value) {
      trackList.push({
        key: 'message3',
        message: [
          needAssetInfo.value ? '资产情况' : '',
          needSesameScore.value ? '芝麻分' : '',
          needResidentInfo.value ? '常驻省市' : '',
        ].filter(Boolean).join('、'),
      })
    }
    if (needAssetInfo.value) {
      trackList.push({
        key: 'message5',
        message: assetOptions.value?.length === 1
          ? `${assetOptions.value[0].label}/${assetOptions.value[0].noneLabel}`
          : assetOptions.value.map((o) => o.label).join('/'),
      })
    }
    trackList.push({
      key: 'info5',
      message: window.location.href,
    })
    track({
      eventType: 'view',
      sceneType: 'receive',
      resultType: 'page',
      dataInfoList: trackList,
    })
  } catch (err) {
    console.error('union_login or home_page error', err)
  } finally {
    loading.value = false
  }
}
initLogin()

const openAssetPopupStep1 = () => {
  const unselected = FIVE_ASSET_VALUES.value.filter((v) => !isAssetAnswered(v))
  if (unselected.length === 1) {
    assetPopupStep1Mode.value = 'single'
    assetPopupStep1SingleOption.value = assetOptions.value.find((o) => o.value === unselected[0]) ?? null
  } else {
    assetPopupStep1Mode.value = 'all'
    assetPopupStep1SingleOption.value = null
  }
}

const buildSaveAssetPayload = () => {
  const assetItems = assetOptions.value.map((opt) => {
    let haveFlag
    if (assets.value.includes(opt.value)) haveFlag = true
    else if (assets.value.includes('no_' + opt.value)) haveFlag = false
    return { assetCode: opt.value.toUpperCase(), haveFlag }
  })
  return { assetItems }
}
const assetCodeMap = computed(() => {
  const map = {}
  for (const opt of assetOptions.value) {
    map[opt.value.toUpperCase()] = opt
  }
  return map
})

function getAssetDesc(assetItems = []) {
  if (!Array.isArray(assetItems) || assetItems.length === 0) return ''
  // 1. 优先找任意一条 haveFlag === false
  const firstFalse = assetItems.find((it) => it.haveFlag === false)
  if (firstFalse) {
    const opt = assetCodeMap.value[firstFalse.assetCode]
    return opt?.noneLabel || ''
  }
  // 2. 没有 false，返回所有 true 的「有 xx」
  const haveLabels = assetItems
    .filter((it) => it.haveFlag === true)
    .map((it) => assetCodeMap.value[it.assetCode]?.label)
    .filter(Boolean)
  return haveLabels.join('、')
}

const trackResult = (dataInfoList = []) => {
  track({
    eventType: 'result',
    sceneType: 'receive',
    resultType: 'suc',
    dataInfoList,
  })
}

const handleViewLimit = () => {
  totalStepList.value = []
  currentStep.value = ''

  track({
    eventType: 'click',
    sceneType: 'receive',
    resultType: 'button',
    dataInfoList: [
      {key: 'message', message: needAssetInfo.value || needResidentInfo.value || needSesameScore.value ? '有提额卡片' : '无提额卡片'},
      {key: 'message2', message: '提交'},
      {key: 'info5', message: window.location.href},
    ],
  })

  if (!needAssetInfo.value && !needResidentInfo.value && !needSesameScore.value) {
    const trackInfoList = [
      {key: 'message', message: '流量承接页'},
      {key: 'info5', message: window.location.href},
    ]
    trackResult(trackInfoList)
    onDownload()
    return
  }
  if (needAssetInfo.value && !assets.value.length) totalStepList.value.push('assets')
  if (needSesameScore.value && !sesameScoreText.value) totalStepList.value.push('sesameScore')
  if (needResidentInfo.value && !cityText.value) totalStepList.value.push('city')
  currentStep.value = totalStepList.value.length ? totalStepList.value[0] : ''
  console.log('handleViewLimit=====', totalStepList.value, currentStepIndex.value)

  const sesameScoreDesc = sesameScoreOptions.value.find((o) => o.value === sesameScoreText.value)?.label || ''

  const dataInfoList = [
    {key: 'message', message: '流量承接页'},
    {key: 'message5', message: [
      needAssetInfo.value && assets.value.length ? '资产情况(' + getAssetDesc(buildSaveAssetPayload().assetItems) + ')' : '',
      needSesameScore.value && sesameScoreText.value ? '芝麻分(' + sesameScoreDesc + ')' : '',
      needResidentInfo.value && cityText.value ? '常驻省市(' + cityText.value + ')' : '',
    ].filter(Boolean).join('、')},
    {key: 'info5', message: window.location.href},
  ]
  trackResult(dataInfoList)

  if (needAssetInfo.value && assets.value.length) saveAssetInfoFn({}, false)

  if (needResidentInfo.value && cityText.value) onSaveAndSubmitCity()

  if (needSesameScore.value && sesameScoreText.value) saveSesameScoreFn()

  if (needAssetInfo.value && !assets.value.length) {
    openAssetPopupStep1()
    showPopup.value = true
    return
  }

  if (needResidentInfo.value && !cityText.value) {
    showPopup.value = true
    return
  }

  if (needSesameScore.value && !sesameScoreText.value) {
      showPopup.value = true
      return
  }

  onDownload()
}

const currentStepIndex = computed(() => {
  return totalStepList.value?.findIndex((s) => s === currentStep.value)
})

const goAfterAssetPopup = () => {
  // currentStep 切换到 totalStepList 中的下一个步骤，用于高亮 dots
  const idx = currentStepIndex.value
  if (totalStepList.value?.length && idx !== -1 && idx + 1 < totalStepList.value.length) {
    currentStep.value = totalStepList.value[idx + 1]
  } else {
    currentStep.value = ''
    showPopup.value = false
    onDownload() // 如果当前步骤是最后一个，则跳转到下载页
  }
  console.log('goAfterAssetPopup=====', currentStep.value)
}

const onSkipAsset = () => {
  goAfterAssetPopup()
}

const saveAssetInfoFn = (trackInfo = {message, message5}, needTrack = true) => {
  const payload = buildSaveAssetPayload()
  saveAssetInfo(payload).catch((err) => console.error('save_asset_info error', err))
  const haveAssetLabel = getAssetDesc(payload.assetItems)
  if (!needTrack) return
  const dataInfoList = [
    {key: 'message', message: trackInfo.message ? trackInfo.message : '流量承接页'},
    {key: 'message5', message: trackInfo.message5 ? trackInfo.message5 : '资产情况(' + haveAssetLabel + ')'},
    {key: 'info5', message: window.location.href},
  ]
  trackResult(dataInfoList)
}

const onSaveAndNextAsset = () => {
  saveAssetInfoFn({message: '流量承接页_补充资料弹窗'})
  goAfterAssetPopup()
}

const saveResidentInfoFn = (options) => {
  cityText.value = options.map((o) => o.text).join(' ')
  const province = options[0]
  const city = options[1]
  if (province && city) {
    const payload = {
      provinceCode: province.value,
      provinceName: province.text,
      cityCode: city.value,
      cityName: city.text,
    }
    residentInfoPayload.value = payload
    saveResidentInfo(payload).catch((err) => console.error('save_resident_info error', err))
  }
}

//首页常驻省市
const onSaveAndSubmitCity = () => {
  // const options = areaRef.value?.getSelectedOptions?.() ?? []
  const options = cityObj.value || []
  if (options && options.length) {
    saveResidentInfoFn(options)
  }
  showAreaPicker.value = false
}

//弹窗常驻省市
const onSubmitAreaPopup = () => {
  const options = popupAreaRef.value?.getSelectedOptions?.() ?? []
  if (options.length) {
    saveResidentInfoFn(options)
  }
  const dataInfoList = [
    {key: 'message', message: '流量承接页_补充资料弹窗'},
    {key: 'message5', message: '常驻省市（' + cityText.value + ')'},
    {key: 'info5', message: window.location.href},
  ]
  trackResult(dataInfoList)
  goAfterAssetPopup()
}

const saveSesameScoreFn = (pageText = '流量承接页', needTrack = false) => {
  const payload = {
    sesameScoreCode: sesameScoreText.value,
  }
  saveSesameScoreInfo(payload).catch((err) => console.error('save_SesameScore_info error', err))
  const sesameScoreDesc = sesameScoreOptions.value.find((o) => o.value === sesameScoreText.value)?.label || ''
  if (!needTrack) return
  const dataInfoList = [
    {key: 'message', message: pageText},
    {key: 'message5', message: '芝麻分（' + sesameScoreDesc + ')'},
    {key: 'info5', message: window.location.href},
  ]
  trackResult(dataInfoList)
}

//弹窗芝麻分
const onSubmitSesameScorePopup = () => {
  saveSesameScoreFn('流量承接页_补充资料弹窗', true)
  goAfterAssetPopup()
}

const onStep2AreaChange = ({ selectedOptions }) => {
  step2HasSelection.value = isAreaSelectionValid(selectedOptions)
}

watch([showPopup, currentStep], ([show]) => {
  step2HasSelection.value = false
  if (!show) {
    assetPopupStep1Mode.value = 'all'
    assetPopupStep1SingleOption.value = null
  }
})

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
    refreshPage()
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
    refreshPage()
    console.error('apk_info error', err)
  }
}

</script>

<template>
  <div class="page" :style="{ backgroundImage: `url(${homeBg})` }">
    <div v-if="loading" class="page-loading-mask">
      <van-loading vertical>加载中...</van-loading>
    </div>
    <!-- 顶部蓝色祝贺条 -->
    <div class="header-bar">
      <span class="header-text">恭喜你！ 成为指易融优质用户</span>
    </div>

    <div class="content">
      <!-- 预估最高综合额度卡片 -->
      <div class="card estimate-card">
        <div class="estimate-card-header">
          <div class="estimate-card-header-title">指易融</div>
          <div class="estimate-card-header-divider"></div>
          <div class="estimate-card-header-subtitle">让金融更容易</div>
        </div>
        <div class="estimate-title">{{ estimateTitle }}</div>
        <div class="estimate-sub">（实际以最终审批结果为准）</div>
        <div class="estimate-amount">{{ formatNumber(estimateAmount) }}</div>
        <div class="estimate-desc">{{ estimateTips }}</div>
      </div>

      <!-- 提额信息卡片 -->
      <div
        v-if="needAssetInfo || needResidentInfo || needSesameScore"
        class="card info-card"
      >
        <div class="card-title">提额信息 <span class="optional">(选填, 获取更高额度)</span></div>

        <div class="section" v-if="needAssetInfo">
          <div class="section-label">
            资产情况
            <span class="multi-hint" v-if="assetOptions.length > 1">(可多选)</span>
          </div>
          <div class="asset-tags" :class="{ 'asset-tags--single': assetOptions.length === 1 }">
            <template v-if="assetOptions.length === 1 && assetOptions[0]">
              <van-tag
                :type="assets.includes(assetOptions[0].value) ? 'primary' : 'default'"
                class="asset-tag"
                :class="{ 'asset-tag--selected': assets.includes(assetOptions[0].value) }"
                @click="toggleAsset(assetOptions[0].value)"
              >
                {{ assetOptions[0].label }}
              </van-tag>
              <van-tag
                :type="assets.includes('no_' + assetOptions[0].value) ? 'primary' : 'default'"
                class="asset-tag"
                :class="{ 'asset-tag--selected': assets.includes('no_' + assetOptions[0].value) }"
                @click="toggleAsset('no_' + assetOptions[0].value)"
              >
                {{ assetOptions[0].noneLabel ?? ('无' + assetOptions[0].label.slice(1)) }}
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

        <div class="section" v-if="needSesameScore">
          <div class="section-label">
            芝麻分
          </div>
          <div class="asset-tags">
            <van-tag
              v-for="opt in sesameScoreOptions"
              :key="opt.value"
              :type="sesameScoreText.includes(opt.value) ? 'primary' : 'default'"
              class="asset-tag"
              :class="{ 'asset-tag--selected': sesameScoreText.includes(opt.value) }"
              @click="toggleSesameScore(opt.value)"
            >
              {{ opt.label }}
            </van-tag>
          </div>
        </div>

        <van-cell
          v-if="needResidentInfo"
          class="info-card-cell"
          title="常驻省市"
          :value="cityText || '请选择所在省市'"
          is-link
          :value-class="cityText ? '' : 'placeholder'"
          @click="showCityPicker"
        />
      </div>

      <!-- 主按钮 -->
      <van-button type="primary" block round class="cta-btn" @click="handleViewLimit">
        <img :src="vectorIcon" class="cta-btn__icon" alt="" />
        <span>点击查看您的专属额度</span>
      </van-button>

      <!-- 温馨提示 -->
      <div class="disclaimer">
        温馨提示：未经您的许可，本平台不会对您的个人信息进行任何处理。请谨慎第三方短信、电话诈骗，确保您的隐私与资金安全。
      </div>
    </div>

    <!-- 省市区选择 -->
    <van-popup v-model:show="showAreaPicker" position="bottom" round :close-on-click-overlay="false">
      <van-area
        ref="areaRef"
        v-model="areaPickerCode"
        title="选择常驻省市"
        :area-list="areaList"
        :columns-num="2"
        :visible-option-num='5'
        :columns-placeholder="['请选择', '请选择']"
        @change="onAreaChange"
        @cancel="showAreaPicker = false"
      >
        <template #confirm>
          <span
            class="area-confirm-btn"
            :class="{ 'area-confirm-btn--disabled': areaSelectionIsDefault }"
            @click.stop="handleAreaConfirmClick($event)"
          >
            确认
          </span>
        </template>
      </van-area>
    </van-popup>

    <!-- 选择资产/城市 两步弹层：第一步资产，第二步芝麻分 ，第三步城市 -->
    <van-popup v-model:show="showPopup" position="bottom" round class="asset-popup" :close-on-click-overlay="false">
      <div class="asset-popup__header">
        <span class="asset-popup__close" @click="closePopup">×</span>
        <span class="asset-popup__title">{{ currentStep == 'assets' ? '选择资产情况' : currentStep == 'city' ? '选择常驻省市' : '选择芝麻分' }}</span>
        <span class="asset-popup__right">
          <span v-if="currentStepIndex + 1 < totalStepList.length" class="asset-popup__skip" @click="onSkipAsset">跳过</span>
        </span>
      </div>
      <!-- 第一步：资产选择 -->
      <template v-if="currentStep === 'assets'">
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
                  {{ assetPopupStep1SingleOption.noneLabel ?? ('无' + assetPopupStep1SingleOption.label.slice(1)) }}
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
          {{ currentStepIndex + 1 < totalStepList.length ? '保存并下一步' : '保存并提交' }}
        </van-button>
      </template>

      <template v-if="currentStep === 'sesameScore'">
        <div class="asset-popup__content">
          <div class="asset-popup__body">
            <div class="asset-tags sesameScore-popup__tags">
              <van-tag
                v-for="opt in sesameScoreOptions"
                :key="opt.value"
                :type="sesameScoreText.includes(opt.value) ? 'primary' : 'default'"
                class="asset-tag"
                :class="{ 'asset-tag--selected': sesameScoreText.includes(opt.value) }"
                @click="toggleSesameScore(opt.value)"
              >
                {{ opt.label }}
              </van-tag>
            </div>
          </div>
        </div>
        <van-button
          type="primary"
          block
          round
          class="asset-popup__btn"
          :disabled="!sesameScoreText"
          @click="onSubmitSesameScorePopup"
        >
          {{ currentStepIndex + 1 < totalStepList.length ? '保存并下一步' : '保存并提交' }}
        </van-button>
      </template>

      <!-- 第三步：城市选择 -->
      <template v-if="currentStep === 'city'">
        <div class="asset-popup__content">
          <div class="asset-popup__area-wrap">
            <van-area
              ref="popupAreaRef"
              :area-list="areaList"
              :columns-num="2"
              :visible-option-num='5'
              :columns-placeholder="['请选择', '请选择']"
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
          @click="onSubmitAreaPopup"
        >
          {{ currentStepIndex + 1 < totalStepList.length ? '保存并下一步' : '保存并提交' }}
        </van-button>
      </template>
      <div v-if="totalStepList.length > 1" class="asset-popup__dots">
        <span
          v-for="i in totalStepList"
          :key="i"
          class="asset-popup__dot"
          :class="{ 'asset-popup__dot--active': currentStep === i }"
        />
      </div>
    </van-popup>
  </div>
</template>

<style lang="scss" scoped>
.page-loading-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(255, 255, 255, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

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
    font-weight: 600;
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
    font-weight: 800;
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
    font-weight: 300;
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
  font-weight: 500;
  font-size: 10px;
  color: #BEC0C2;
  line-height: 20px;
}

.estimate-amount {
  font-size: 56px;
  font-weight: 700;
  color: #000000;
  line-height: 56px;
  margin-bottom: 7px;
  font-family: 'DIN Alternate';
}

.estimate-desc {
  font-size: 10px;
  color: #BEC0C2;
  line-height: 20px;
  padding-bottom: 20px;
  font-weight: 500;
}

.info-card {
  padding: 12px;
}

.info-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
}

.optional {
  font-size: 16px;
  color: #BEC0C2;
  font-weight: 400;
}

.section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 10px;
}

.multi-hint {
  font-size: 14px;
  color: #0052D9;
  font-weight: 400;
  margin-left: 4px;
}

.asset-tags {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 12px;
}

.asset-tags :deep(.van-tag),
.asset-popup__tags :deep(.van-tag) {
  cursor: pointer;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  margin: 0;
  border: none;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.asset-tags :deep(.van-tag.van-tag--default),
.asset-popup__tags :deep(.van-tag.van-tag--default) {
  background: #F3F3F3;
  color: #333333;
  font-weight: 500;
  font-size: 14px;
}

.asset-tags :deep(.van-tag.asset-tag--selected),
.asset-tags :deep(.van-tag.van-tag--primary),
.asset-popup__tags :deep(.van-tag.asset-tag--selected),
.asset-popup__tags :deep(.van-tag.van-tag--primary) {
  background: #F2F3FF;
  color: #0052D9;
  font-weight: 500;
  font-size: 14px;
}
.asset-popup__tags :deep(.van-tag.asset-tag--selected),
.asset-popup__tags :deep(.van-tag.van-tag--primary),
.sesameScore-popup__tags :deep(.van-tag.van-tag--primary),
.sesameScore-popup__tags :deep(.van-tag.asset-tag--selected) {
  border: 1px solid #0052D9;
}

.info-card-cell {
  :deep(.van-icon-arrow) {
    color: #000000;
    font-size: 18px;
  }
  :deep(.van-cell__value) {
    text-align: left;
    // color: #000000; // ui todo
  }
  :deep(.placeholder) {
    color: #BEC0C2 !important;
    font-weight: 500;
    font-size: 14px;
  }
  :deep(.van-cell__title) {
    flex: unset;
    margin-right: 44px;
  }
}

.info-card :deep(.van-cell) {
  padding: 12px 0;
}

.info-card :deep(.van-cell::after) {
  display: none;
}

.info-card :deep(.van-cell__title) {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.placeholder {
  color: #BEC0C2 !important;
  font-weight: 500;
  font-size: 14px;
}

.cta-btn {
  margin-top: 24px;
  height: 48px;
  font-size: 18px;
  background-color: #056EEA;
  font-weight: 500;
}

.cta-btn :deep(.van-button__text) {
  display: inline-flex;
  gap: 8px;
}

.cta-btn__icon {
  height: 22px;
  width: auto;
  vertical-align: middle;
}

.disclaimer {
  margin-top: 16px;
  margin-bottom: 24px;
  padding: 0 4px;
  font-size: 12px;
  color: #BEC0C2;
  font-weight: 400;
  line-height: 1.6;
}

.area-confirm-btn {
  color: #0052D9;
  font-size: 14px;
  padding: 0 4px;
}
.area-confirm-btn--disabled {
  color: #979797;
  cursor: not-allowed;
}

.area-submit-btn {
  margin: 16px;
  margin-top: 0;
  height: 48px;
  font-size: 16px; 
  width: calc(100% - 32px);
  font-weight: 600;
  background-color: #056EEA;
}

/* 选择资产情况弹层 */
.asset-popup {
  padding: 0 0 24px;

  :deep(.van-button--disabled) {
    background-color: #B5C7FF;
    border-color: #B5C7FF;
    opacity: 1 !important;
  }
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
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  text-align: center;
  justify-self: center;
}                             

.asset-popup__right {
  text-align: right;
}

.asset-popup__skip {
  font-size: 14px;
  color: #979797;
  cursor: pointer;
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

.asset-popup__btn {
  width: calc(100% - 32px);
  margin: 0 16px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background-color: #056EEA;
  box-sizing: border-box;
}

.asset-popup__area-wrap {
  height: 100%;
  padding: 0 16px 8px;
  min-height: 150px;
}

.asset-popup__area-wrap :deep(.van-picker__toolbar) {
  display: none;
}

:deep(.van-picker-column__item--selected) {
  font-weight: 600;
  font-size: 16px;
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
  background: #0052D9;
}
</style>
