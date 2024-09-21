import { ref } from 'vue';

export function useWebSocket(url) {
  const socket = ref(null);
  const isConnected = ref(false);

  const connect = (config) => {
    console.log('Attempting to connect to WebSocket:', url);
    socket.value = new WebSocket(url);

    socket.value.onopen = () => {
      console.log('WebSocket connection established');
      isConnected.value = true;
      socket.value.send(JSON.stringify({
        type: 'connect',
        ...config
      }));
    };

    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.value.onclose = () => {
      console.log('WebSocket connection closed');
      isConnected.value = false;
    };
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.close();
    }
  };

  const sendMessage = (message) => {
    if (socket.value && isConnected.value) {
      socket.value.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  };

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    sendMessage
  };
}