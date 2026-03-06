import request from '../utils/request'

/**
 * H5 联合登录
 */
export function unionLogin(data) {
  return request.post('/h5/union_login', data)
}
