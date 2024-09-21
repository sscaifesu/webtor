<template>
  <button @click="toggleTheme" class="absolute top-2.5 right-2.5 p-2 rounded-full transition-colors duration-200">
    <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" class="text-xl text-gray-600 dark:text-gray-400" />
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme';

const { toggleTheme, isDarkMode } = useTheme();
</script>