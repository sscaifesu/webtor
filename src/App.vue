<template>
  <div class="container mx-auto px-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative min-h-screen flex flex-col">
    <button @click="toggleTheme" class="absolute top-2.5 right-2.5 p-2 rounded-full transition-colors duration-200">
      <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" class="text-xl text-gray-600 dark:text-gray-400" />
    </button>
    
    <nav class="flex flex-col items-center py-4">
      <div class="flex items-center mb-2">
        <svg class="h-10 w-10 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4" width="20" height="16" rx="2" class="stroke-current text-blue-800 dark:text-blue-200" stroke-width="2"/>
          <path d="M6 8L10 12L6 16M14 16H18" class="stroke-current text-blue-800 dark:text-blue-200" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h1 class="text-4xl font-bold">Webtor</h1>
      </div>
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-4">一款轻量化的模拟终端应用</p>
    </nav>

    <main class="flex-grow">
      <div class="space-y-4">
        <form @submit.prevent="connect" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input v-model="host" placeholder="主机" required autocomplete="off" class="w-full px-3 py-2 border rounded" />
            <input v-model.number="port" placeholder="端口" type="number" required autocomplete="off" class="w-full px-3 py-2 border rounded" />
            <input v-model="username" placeholder="用户名" required autocomplete="username" class="w-full px-3 py-2 border rounded" />
            <input v-model="password" placeholder="密码" type="password" required autocomplete="current-password" class="w-full px-3 py-2 border rounded" />
          </div>
          <div class="mt-4 flex justify-end space-x-2">
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">连接</button>
            <button type="button" @click="saveConfig" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">保存配置</button>
          </div>
        </form>

        <div class="flex space-x-2">
          <select v-model="selectedConfig" @change="loadConfig" class="flex-grow px-3 py-2 border rounded">
            <option value="">选择保存的配置</option>
            <option v-for="config in savedConfigs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
          <button @click="deleteConfig" v-if="selectedConfig" class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            <font-awesome-icon icon="trash" />
          </button>
        </div>

        <div>
          <div class="flex border-b border-gray-200 dark:border-gray-700">
            <div 
              v-for="(tab, index) in tabs" 
              :key="index" 
              @click="activeTab = index"
              class="px-4 py-2 cursor-pointer flex items-center rounded-t-lg transition-colors duration-200 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              :class="{ 'bg-gray-200 dark:bg-gray-700': activeTab === index, 'bg-gray-100 dark:bg-gray-600': activeTab !== index }"
            >
              终端 {{ index + 1 }}
              <span class="ml-2 text-xs cursor-pointer hover:text-red-500" @click.stop="closeTab(index)">&times;</span>
            </div>
            <button @click="addTab" class="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-t-lg transition-colors duration-200">
              <font-awesome-icon icon="plus" />
            </button>
          </div>
          <div v-for="(tab, index) in tabs" :key="index" v-show="activeTab === index" class="h-96 bg-black rounded-b-lg overflow-hidden">
            <div :id="'terminal-' + index" class="h-full"></div>
          </div>
        </div>
      </div>
    </main>

    <footer class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      © {{ new Date().getFullYear() }} Webtor 由 evalEvil 开发，保留所有权利。
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const isDarkMode = ref(false)
const host = ref('')
const port = ref(22)
const username = ref('')
const password = ref('')
const tabs = ref([{ terminal: null, socket: null }])
const activeTab = ref(0)
const savedConfigs = ref([])
const selectedConfig = ref('')
const wsUrl = ref('')

onMounted(() => {
  // 获取当前页面的主机名和端口
  const host = window.location.hostname
  const port = 3000 // 后端服务器端口
  wsUrl.value = `ws://${host}:${port}`

  initTheme()
  loadSavedConfigs()
  initTerminal(0)
})

watch(tabs, () => {
  nextTick(() => {
    tabs.value.forEach((tab, index) => {
      if (!tab.terminal) {
        initTerminal(index)
      }
    })
  })
}, { deep: true })

function initTerminal(index) {
  return new Promise((resolve) => {
    const terminal = new Terminal({
      theme: {
        background: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bg-color').trim(),
        foreground: getComputedStyle(document.documentElement).getPropertyValue('--terminal-text-color').trim(),
      }
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    const element = document.getElementById(`terminal-${index}`)
    if (element) {
      terminal.open(element)
      fitAddon.fit()
      window.addEventListener('resize', () => fitAddon.fit())
      tabs.value[index].terminal = terminal
      // 初始化完成后，设置 onData 事件处理器
      terminal.onData((data) => {
        const currentTab = tabs.value[index]
        if (currentTab.socket && currentTab.socket.readyState === WebSocket.OPEN) {
          currentTab.socket.send(JSON.stringify({ type: 'command', command: data }))
        }
      })
      resolve()
    } else {
      console.error(`Terminal element not found: terminal-${index}`)
      resolve()
    }
  })
}

function connect() {
  const currentTab = tabs.value[activeTab.value]
  if (!currentTab.terminal) {
    console.error('Terminal not initialized')
    return
  }
  
  if (currentTab.socket) {
    currentTab.socket.close()
  }

  currentTab.socket = new WebSocket(wsUrl.value)
  
  currentTab.socket.onopen = () => {
    currentTab.socket.send(JSON.stringify({
      type: 'connect',
      host: host.value,
      port: port.value,
      username: username.value,
      password: password.value
    }))
  }
  
  currentTab.socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'data') {
      currentTab.terminal.write(data.data)
    } else if (data.type === 'error') {
      console.error(data.message)
      currentTab.terminal.write(`\r\n错误: ${data.message}\r\n`)
    } else if (data.type === 'info') {
      currentTab.terminal.write(`\r\n信息: ${data.message}\r\n`)
    }
  }

  currentTab.socket.onerror = (error) => {
    console.error('WebSocket error:', error)
    currentTab.terminal.write(`\r\n错误: WebSocket 连接失败\r\n`)
  }

  currentTab.socket.onclose = () => {
    currentTab.terminal.write(`\r\n信息: 连接已关闭\r\n`)
  }
}

function addTab() {
  tabs.value.push({ terminal: null, socket: null })
  activeTab.value = tabs.value.length - 1
  nextTick(() => {
    initTerminal(activeTab.value).then(() => {
      // 初始化终端后自动连接
      connect()
    })
  })
}

function closeTab(index) {
  if (tabs.value[index].socket) {
    tabs.value[index].socket.close()
  }
  tabs.value.splice(index, 1)
  if (activeTab.value >= tabs.value.length) {
    activeTab.value = tabs.value.length - 1
  }
}

function saveConfig() {
  const newConfig = {
    id: Date.now(),
    name: `${host.value}:${port.value}`,
    host: host.value,
    port: port.value,
    username: username.value,
    password: password.value
  }
  savedConfigs.value.push(newConfig)
  localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs.value))
}

function loadSavedConfigs() {
  const configs = localStorage.getItem('savedConfigs')
  if (configs) {
    savedConfigs.value = JSON.parse(configs)
  }
}

function loadConfig() {
  const config = savedConfigs.value.find(c => c.id === selectedConfig.value)
  if (config) {
    host.value = config.host
    port.value = config.port
    username.value = config.username
    password.value = config.password
  }
}

function deleteConfig() {
  if (selectedConfig.value) {
    savedConfigs.value = savedConfigs.value.filter(c => c.id !== selectedConfig.value)
    localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs.value))
    selectedConfig.value = ''
    host.value = ''
    port.value = 22
    username.value = ''
    password.value = ''
  }
}

function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDarkMode.value = localStorage.getItem('theme') === 'dark' || (localStorage.getItem('theme') === null && prefersDark)
  applyTheme()
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  applyTheme()
}

function applyTheme() {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
  const newTheme = {
    background: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bg-color').trim(),
    foreground: getComputedStyle(document.documentElement).getPropertyValue('--terminal-text-color').trim(),
  }
  tabs.value.forEach(tab => {
    if (tab.terminal) {
      tab.terminal.options.theme = newTheme
      tab.terminal.refresh(0, tab.terminal.rows - 1)
    }
  })
}

</script>
