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
