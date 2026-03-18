import { createApp } from 'vue'
import { Loading } from 'vant'
import './style.scss'
import App from './App.vue'
import router from './router'
import 'vant/es/toast/style'
import VConsole from 'vconsole'
import logoUrl from '@/assets/images/logo.png'
// 非生产环境启用 vConsole
if (import.meta.env.MODE !== 'production') {
  // eslint-disable-next-line no-new
  new VConsole()
}

// 设置页面 icon（favicon）为 logo.png
const favicon = document.querySelector('link[rel="icon"]')
if (favicon) {
  favicon.href = logoUrl
  favicon.type = 'image/png'
}

const app = createApp(App)
app.use(router)
app.use(Loading)
app.mount('#app')
