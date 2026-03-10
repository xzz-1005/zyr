import { createApp } from 'vue'
import { Loading } from 'vant'
import './style.scss'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.use(Loading)
app.mount('#app')
