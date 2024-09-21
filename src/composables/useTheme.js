import { ref } from 'vue';

// 将 isDarkMode 定义在函数外部
const isDarkMode = ref(false);

export function useTheme() {

  const initTheme = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode.value = localStorage.getItem('theme') === 'dark' || (localStorage.getItem('theme') === null && prefersDark);
    applyTheme();
  };

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
    applyTheme();
  };

  const applyTheme = () => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return {
    isDarkMode,
    initTheme,
    toggleTheme
  };
}