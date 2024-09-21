<template>
  <div :id="terminalId" class="h-full"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, getCurrentInstance } from 'vue';
import { useTerminal } from '../composables/useTerminal';
import { useWebSocket } from '../composables/useWebSocket';

const props = defineProps(['terminalId', 'connectionConfig']);
const { terminal, initTerminal, writeToTerminal, disposeTerminal } = useTerminal();
const { socket, connect, disconnect, sendMessage } = useWebSocket('ws://localhost:3000');

onMounted(async () => {
  try {
    await initTerminal(props.terminalId);

    // 检查 connectionConfig 是否存在
    if (!props.connectionConfig) {
      console.error('No connection configuration provided to Terminal component.');
      return;
    }

    // 初始化 WebSocket 连接
    connect(props.connectionConfig);

    // 设置 WebSocket 消息处理
    socket.value.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'data') {
          writeToTerminal(message.data);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    // 处理终端输入
    if (terminal.value) {
      terminal.value.onData((data) => {
        sendMessage({ type: 'command', command: data });
      });
    }

    // 将当前终端实例添加到父组件的 terminalRefs 中
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
      const index = props.terminalId.split('-')[1];
      currentInstance.parent.terminalRefs.value[index] = currentInstance.proxy;
    }
  } catch (error) {
    console.error('Failed to initialize terminal:', error);
  }
});

onUnmounted(() => {
  try {
    disconnect();
    disposeTerminal();
  } catch (error) {
    console.error('Error during unmounting:', error);
  }
});
</script>