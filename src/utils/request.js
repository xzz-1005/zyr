import axios from 'axios'

const baseURL = import.meta.env.VITE_APP_BASE_URL || ''

const request = axios.create({
  baseURL,
  timeout: 15000,
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

export default request
