import { createApp } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSun, faMoon, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import './index.css'  // 确保这行存在
import App from './App.vue'

library.add(faSun, faMoon, faTrash, faPlus)

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')