import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import ru from 'element-plus/es/locale/lang/ru'
import 'element-plus/dist/index.css'
import { notify } from '@/shared/lib'
import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: ru })

// Непойманные ошибки не должны теряться молча
app.config.errorHandler = (error) => {
  console.error(error)
  notify.error(error)
}

app.mount('#app')
