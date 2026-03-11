import { createApp } from 'vue'
import { Loading } from 'vant'
import './style.scss'
import App from './App.vue'
import router from './router'
import 'vant/es/toast/style'
import VConsole from 'vconsole'

// 非生产环境启用 vConsole
if (import.meta.env.MODE !== 'production') {
  // eslint-disable-next-line no-new
  new VConsole()
}

const app = createApp(App)
app.use(router)
app.use(Loading)
app.mount('#app')
