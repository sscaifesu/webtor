<template>
    <form @submit.prevent="$emit('connect')" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input v-model="host" placeholder="主机" required autocomplete="off" class="w-full px-3 py-2 border rounded" />
        <input v-model.number="port" placeholder="端口" type="number" required autocomplete="off" class="w-full px-3 py-2 border rounded" />
        <input v-model="username" placeholder="用户名" required autocomplete="username" class="w-full px-3 py-2 border rounded" />
        <input v-model="password" placeholder="密码" type="password" required autocomplete="current-password" class="w-full px-3 py-2 border rounded" />
      </div>
      <div class="mt-4 flex justify-end space-x-2">
        <button type="button" @click="$emit('disconnect')" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">断开</button>
        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">连接</button>
        <button type="button" @click="$emit('save')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">保存配置</button>
      </div>
      <!-- 配置选择器 -->
      <div class="mt-4">
        <select v-model="selectedConfigId" @change="loadConfig" class="w-full px-3 py-2 border rounded mb-2">
          <option value="">选择保存的配置</option>
          <option v-for="config in props.savedConfigs" :key="config?.id" :value="config?.id">
            {{ config?.host }} - {{ config?.username }}
          </option>
        </select>
        <button
          v-if="selectedConfigId"
          type="button"
          @click="deleteConfig"
          class="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mt-2"
        >
          删除
        </button>
      </div>
    </form>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useConfig } from '../composables/useConfig';

  const props = defineProps({
    savedConfigs: {
      type: Array,
      default: () => [],
    },
  });

  const host = ref('');
  const port = ref(22);
  const username = ref('');
  const password = ref('');
  const selectedConfigId = ref('');

  const { deleteConfig: deleteSavedConfig } = useConfig();

  defineEmits(['connect', 'save', 'reload', 'disconnect']);
  defineExpose({
    host,
    port,
    username,
    password,
  });

  const loadConfig = () => {
    const config = props.savedConfigs.find((c) => c?.id === selectedConfigId.value);
    if (config) {
      host.value = config.host;
      port.value = config.port;
      username.value = config.username;
      password.value = config.password;
    }
  };

  const deleteConfig = () => {
    if (selectedConfigId.value) {
      deleteSavedConfig(selectedConfigId.value);
      selectedConfigId.value = '';
      // 重新加载配置列表
      emit('reload');
    }
  };
  </script>