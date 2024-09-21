<template>
  <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">保存的配置</h2>
      <button
        @click="handleDeleteConfig"
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        :disabled="!selectedConfigId"
      >
        <font-awesome-icon icon="trash" class="mr-2" />
        删除配置
      </button>
    </div>
    <select v-model="selectedConfigId" @change="loadConfig" class="w-full px-3 py-2 border rounded mb-4">
      <option value="">选择保存的配置</option>
      <option v-for="config in savedConfigs" :key="config.id" :value="config.id">
        {{ config.host }} - {{ config.username }}
      </option>
    </select>
  </div>
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

const emit = defineEmits(['load']);

const selectedConfigId = ref('');

const { deleteConfig } = useConfig();

const loadConfig = () => {
  const config = props.savedConfigs.find((c) => c.id === selectedConfigId.value);
  if (config) {
    // 将配置发送给父组件
    emit('load', config);
  }
};

const handleDeleteConfig = () => {
  if (selectedConfigId.value) {
    deleteConfig(selectedConfigId.value);
    selectedConfigId.value = '';
    // 重新加载配置列表
    emit('reload');
  }
};
</script>