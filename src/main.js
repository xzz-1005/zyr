import { createApp } from 'vue'
import { Loading } from 'vant'
import './style.scss'
import App from './App.vue'
import router from './router'
import 'vant/es/toast/style'

const app = createApp(App)
app.use(router)
app.use(Loading)
app.mount('#app')
