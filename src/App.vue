<template>
  <div class="container mx-auto px-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative min-h-screen flex flex-col">
    <ThemeToggle />
    
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
        <ConnectionForm
          @connect="connect"
          @save="handleSaveConfig"
          @reload="reloadConfigs"
          @disconnect="disconnect"
          :saved-configs="savedConfigs"
          ref="connectionForm"
        />
        <!-- <ConfigManager @load="loadConfig" @delete="deleteConfig" /> -->  <!-- 暂时注释掉 -->
        
        <div>
          <div class="flex border-b border-gray-200 dark:border-gray-700">
            <div 
              v-for="(tab, index) in tabs" 
              :key="tab.id" 
              @click="setActiveTab(index)"
              @dblclick="editTabLabel(index)"
              class="px-4 py-2 cursor-pointer flex items-center rounded-t-lg transition-colors duration-200 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              :class="{ 'bg-gray-200 dark:bg-gray-700': activeTab === index, 'bg-gray-100 dark:bg-gray-600': activeTab !== index }"
            >
              <input
                v-if="tab.isEditing"
                v-model="tab.label"
                @blur="stopEditingTabLabel(index)"
                @keyup.enter="stopEditingTabLabel(index)"
                class="bg-transparent border-none focus:outline-none"
              />
              <span v-else>{{ tab.label }}</span>
              <span class="ml-2 text-xs cursor-pointer hover:text-red-500" @click.stop="closeTab(index)" title="关闭标签">&times;</span>
            </div>
            <button @click="addTab()" class="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-t-lg transition-colors duration-200" title="新增标签">
              <font-awesome-icon icon="plus" />
            </button>
          </div>
          <div v-for="(tab, index) in tabs" :key="tab.id" v-show="activeTab === index" class="h-96 bg-black rounded-b-lg overflow-hidden">
            <Terminal 
              :terminal-id="'terminal-' + tab.id" 
              :connection-config="tab.connectionConfig"
              ref="terminalRefs"
            />
          </div>
        </div>
      </div>
    </main>

    <footer class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      © {{ new Date().getFullYear() }} Webtor 由 <a href="https://github.com/sscaifesu/webtor" class="text-blue-500 hover:underline">evalEvil</a> 开发，保留所有权利。
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import Terminal from './components/Terminal.vue';
import ConnectionForm from './components/ConnectionForm.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import { useConfig } from './composables/useConfig';
import { useTheme } from './composables/useTheme';

const { saveConfig, loadSavedConfigs, savedConfigs } = useConfig();
const { initTheme } = useTheme();

const tabs = ref([]);
const activeTab = ref(0);
const connectionForm = ref(null);
const terminalRefs = ref([]);
const lastConnectionConfig = ref(null);

onMounted(() => {
  try {
    initTheme();
    loadSavedConfigs();
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

const connect = () => {
  try {
    const config = {
      host: connectionForm.value.host,
      port: connectionForm.value.port,
      username: connectionForm.value.username,
      password: connectionForm.value.password
    };
    lastConnectionConfig.value = config;
    addTab(config);
  } catch (error) {
    console.error('Error connecting:', error);
  }
};

const handleSaveConfig = () => {
  try {
    const config = {
      id: Date.now(),
      host: connectionForm.value.host,
      port: connectionForm.value.port,
      username: connectionForm.value.username,
      password: connectionForm.value.password
    };
    saveConfig(config);
    alert('配置已保存');
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
};

const addTab = (connectionConfig = null) => {
  try {
    if (!connectionConfig) {
      if (lastConnectionConfig.value) {
        connectionConfig = lastConnectionConfig.value;
      } else {
        console.error('没有可用的连接配置。');
        return;
      }
    }
    const newTab = { id: Date.now(), connectionConfig, label: `终端 ${tabs.value.length + 1}`, isEditing: false };
    tabs.value.push(newTab);
    activeTab.value = tabs.value.length - 1;
    nextTick(() => {
      // 确保 DOM 更新后再执行其他操作
    });
  } catch (error) {
    console.error('Error adding tab:', error);
  }
};

const closeTab = (index) => {
  try {
    if (terminalRefs.value[index] && typeof terminalRefs.value[index].disposeTerminal === 'function') {
      try {
        terminalRefs.value[index].disposeTerminal();
      } catch (error) {
        console.warn(`Error disposing terminal at index ${index}:`, error);
      }
    }
    tabs.value.splice(index, 1);
    terminalRefs.value.splice(index, 1);
    if (activeTab.value >= tabs.value.length) {
      activeTab.value = Math.max(0, tabs.value.length - 1);
    }
  } catch (error) {
    console.error('Error closing tab:', error);
  }
};

const setActiveTab = (index) => {
  try {
    activeTab.value = index;
  } catch (error) {
    console.error('Error setting active tab:', error);
  }
};

const reloadConfigs = () => {
  loadSavedConfigs();
};

const disconnect = () => {
  if (activeTab.value >= 0 && activeTab.value < tabs.value.length) {
    closeTab(activeTab.value);
  }
};

const editTabLabel = (index) => {
  tabs.value[index].isEditing = true;
  nextTick(() => {
    const input = document.querySelector(`input[v-model="tabs.value[${index}].label"]`);
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const stopEditingTabLabel = (index) => {
  tabs.value[index].isEditing = false;
};
</script>