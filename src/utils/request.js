import axios from 'axios'
import { isIOS } from './device'

const baseURL = import.meta.env.VITE_APP_BASE_URL || ''

const request = axios.create({
  baseURL,
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  console.log('request config=====', config, config.url)
  const token = localStorage.getItem('loginToken')
  config.headers['Authorization'] = config.url === '/h5/union_login' ? undefined : token || undefined
  config.headers['App-Version'] = '1.0.0'
  config.headers['App-Env'] = import.meta.env.VITE_APP_ENV
  config.headers['App-Market'] = 'APP_STORE'
  config.headers['Device-Id'] = 'AJSHQZDSD'
  config.headers['Device-Brand'] = 'APPLE 11 PRO'
  config.headers['Device-Model'] = 'MWDH2CHA'
  config.headers['Device-Type'] = isIOS() ? 'IOS' : 'ANDROID'
  config.headers['System-Version'] = '26.2'
  config.headers['System-Version-Code'] = isIOS() ? 'IOS_26.2' : 'ANDROID_26.2'
  config.headers['App-Code'] = 'ZYR'
  config.headers['Source-App-Code'] = 'API_TCSK'  
  return config
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

export default request
