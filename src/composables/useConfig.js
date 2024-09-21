import { ref } from 'vue';

const savedConfigs = ref([]);

export function useConfig() {
  const loadSavedConfigs = () => {
    const configs = localStorage.getItem('savedConfigs');
    if (configs) {
      savedConfigs.value = JSON.parse(configs).filter(config => config); // 过滤掉 null 或未定义的项
    }
  };

  const saveConfig = (config) => {
    // 检查是否已存在相同的配置（根据主机、用户名和端口）
    const exists = savedConfigs.value.find(
      (c) => c.host === config.host && c.username === config.username && c.port === config.port
    );
    if (!exists) {
      savedConfigs.value.push(config);
      localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs.value));
    } else {
      console.warn('配置已存在，未重复保存。');
    }
  };

  const deleteConfig = (id) => {
    savedConfigs.value = savedConfigs.value.filter((config) => config.id !== id);
    localStorage.setItem('savedConfigs', JSON.stringify(savedConfigs.value));
  };

  return {
    savedConfigs,
    loadSavedConfigs,
    saveConfig,
    deleteConfig,
  };
}