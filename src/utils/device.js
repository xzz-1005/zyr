/**
 * 是否为 iOS 设备（含 iPhone、iPad、iPod）
 * iPad iOS 13+ 会识别为 MacIntel，通过 maxTouchPoints 辅助判断
 */
export function isIOS() {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  return false
}

/**
 * 是否为鸿蒙设备
 */
export function isHarmony() {
  return /HarmonyOS|HMSCore/.test(navigator.userAgent)
}

export function getPhoneBrand() {
  const ua = navigator.userAgent.toLowerCase();
  console.log('getPhoneBrand=====', navigator.userAgent, ua)
  if (ua.includes('huawei')) {
    return 'huawei'; // 华为
  } else if (ua.includes('honor')) {
    return 'honor'; // 荣耀
  } else if (ua.includes('xiaomi') || ua.includes('mi ')) {
    return 'xiaomi'; // 小米/红米
  } else if (ua.includes('oppo')) {
    return 'oppo'; // OPPO
  } else if (ua.includes('vivo') || ua.includes('vivo ')) {
    return 'vivo'; // VIVO
  } else if (ua.includes('samsung')) {
    return 'samsung'; // 三星
  } else if (ua.includes('meizu')) {
    return 'meizu'; // 魅族
  } else if (ua.includes('oneplus')) {
    return 'oneplus'; // 一加
  } else {
    return 'other'; // 其他品牌（如中兴、联想等）
  }
}
