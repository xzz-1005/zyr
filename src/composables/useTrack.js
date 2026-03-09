import { useRouter } from 'vue-router'
import { trackEvent } from '../api/common'

/**
 * 埋点 composable
 * @returns {{ track: (eventInfo: object, params?: object) => void }}
 */
export function useTrack() {
  const router = useRouter()

  /**
   * 埋点上报
   * @param {object} eventInfo - 事件名称
   * @param {object} [params] - 附加参数
   */
  const track = (eventInfo, params = {}) => {
    const payload = {
      productCode: eventInfo.productCode,
      eventType: eventInfo.eventType,
      sceneType: eventInfo.sceneType,
      resultType: eventInfo.resultType,
      dataInfoList: eventInfo.dataInfoList || [{key: '', message:''}],
      // page: router.currentRoute.value?.path ?? '',
      // timestamp: Date.now(),
      ...params,
    }
    console.log('[track]', payload)
    trackEvent(payload).catch((err) => console.error('track_event error', err))
  }

  return { track }
}
