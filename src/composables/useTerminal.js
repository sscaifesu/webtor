import { ref } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

export function useTerminal() {
  const terminal = ref(null);
  let fitAddon = null;
  let isInitialized = ref(false);
  let resizeHandler = null;
  let isFitAddonLoaded = false; // 新增状态标志

  const initTerminal = (elementId) => {
    return new Promise((resolve) => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with id ${elementId} not found`);
        resolve();
        return;
      }

      terminal.value = new Terminal({
        theme: {
          background: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bg-color').trim(),
          foreground: getComputedStyle(document.documentElement).getPropertyValue('--terminal-text-color').trim(),
        }
      });

      fitAddon = new FitAddon();
      terminal.value.loadAddon(fitAddon);
      isFitAddonLoaded = true; // 标记 FitAddon 已加载

      setTimeout(() => {
        terminal.value.open(element);
        fitAddon.fit();
        resizeHandler = () => {
          if (fitAddon) fitAddon.fit();
        };
        window.addEventListener('resize', resizeHandler);
        isInitialized.value = true;
        resolve();
      }, 0);
    });
  };

  const writeToTerminal = (data) => {
    if (terminal.value && isInitialized.value) {
      console.log('Writing to terminal:', data);
      terminal.value.write(data);
    } else {
      console.warn('Cannot write to terminal: terminal not initialized');
    }
  };

  const disposeTerminal = () => {
    if (terminal.value) {
      // 移除 resize 事件监听器
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
      }

      // 销毁 FitAddon
      if (fitAddon && isFitAddonLoaded) {
        try {
          fitAddon.dispose();
          isFitAddonLoaded = false; // 更新状态标志
        } catch (error) {
          console.warn('Error disposing FitAddon:', error);
        }
        fitAddon = null;
      }

      // 销毁终端
      try {
        terminal.value.dispose();
      } catch (error) {
        console.warn('Error disposing terminal:', error);
      }
      terminal.value = null;
      isInitialized.value = false;
    }
  };

  return {
    terminal,
    initTerminal,
    writeToTerminal,
    disposeTerminal,
    isInitialized
  };
}