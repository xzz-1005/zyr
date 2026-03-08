import { useRouter } from 'vue-router'

/**
 * 埋点 composable
 * @returns {{ track: (eventName: string, params?: object) => void }}
 */
export function useTrack() {
  const router = useRouter()

  /**
   * 埋点上报
   * @param {string} eventName - 事件名称
   * @param {object} [params] - 附加参数
   */
  const track = (eventName, params = {}) => {
    const payload = {
      event: eventName,
      page: router.currentRoute.value?.path ?? '',
      timestamp: Date.now(),
      ...params,
    }
    // TODO: 对接实际埋点接口或第三方 SDK（如神策、友盟等）
    console.log('[track]', payload)
    // 示例：request.post('/api/track', payload)
  }

  return { track }
}
