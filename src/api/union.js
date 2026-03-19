import request from '@/utils/request'
import { getStringFromLocation } from '@/utils/common'

const productCode = getStringFromLocation('productCode') || 'ZYR'

/**
 * H5 联合登录
 */
export function unionLogin(data = {}) {
  return request.post('/h5/union_login', { productCode, ...data })
}

/**
 * H5 首页
 * @param {object} data - 请求体
 * @param {object} [config] - axios 配置，可传 headers（如 Authorization）
 */
export function homePage(data = {}, config) {
  return request.post('/h5/home_page', { productCode, ...data }, config)
}

/**
 * H5 APK 信息
 * @param {object} data - 请求体
 * @param {object} [config] - axios 配置，可传 headers（如 Authorization）
 */
export function apkInfo(data = {}, config) {
  return request.post('/h5/apk_info', { productCode, ...data }, config)
}

/**
 * H5 保存资产信息
 * @param {object} data - 请求体
 * @param {object} [config] - axios 配置，可传 headers（如 Authorization）
 */
export function saveAssetInfo(data = {}, config) {
  return request.post('/h5/save_asset_info', { productCode, ...data }, config)
}

/**
 * H5 保存常驻信息
 * @param {object} data - 请求体（provinceCode, provinceName, cityCode, cityName, productCode）
 * @param {object} [config] - axios 配置，可传 headers（如 Authorization）
 */
export function saveResidentInfo(data = {}, config) {
  return request.post('/h5/save_resident_info', { productCode, ...data }, config)
}

/**
 * H5 保存芝麻信用
 * @param {object} data - 请求体（sesameScoreText, productCode）
 * @param {object} [config] - axios 配置，可传 headers（如 Authorization）
 */
export function saveSesameScoreInfo(data = {}, config) {
  return request.post('/h5/save_sesame_score', { productCode, ...data }, config)
}
