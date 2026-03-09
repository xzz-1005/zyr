import request from '@/utils/request'

/**
 * 获取常驻省份
 * @param {object} data - 请求体
 * @param {object} [config] - axios 配置，可传 headers（如 Authorization）
 */
export function getResidentCity(data, config) {
  return request.get('/common/region/two_linkage', { params: data }, config)
}

/**
 * 埋点上报
 * @param {object} data - 请求体
 * @param {object} [config] - axios 配置，可传 headers（如 Authorization）
 */
export function trackEvent(data, config) {
  return request.post('/app/trace/event', data, config)
}