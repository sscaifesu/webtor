const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('ssh2');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 添加一个简单的欢迎页面
app.get('/', (req, res) => {
  res.send('欢迎使用 Webtor 远程服务器管理工具 API');
});

// 添加一个通用的 404 处理
app.use((req, res, next) => {
  res.status(404).send('抱歉，您请求的页面不存在。请检查 URL 是否正确。');
});

// 添加一个通用的错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('抱歉，服务器出现了一些问题。请稍后再试。');
});

wss.on('connection', (ws) => {
  let sshClient;

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'connect') {
      if (sshClient) {
        sshClient.end();
      }

      sshClient = new Client();
      
      sshClient.on('ready', () => {
        ws.send(JSON.stringify({ type: 'info', message: '成功连接到服务器' }));
        sshClient.shell((err, stream) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: '无法创建 Shell：' + err.message }));
            return;
          }
          
          stream.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'data', data: data.toString() }));
          });
          
          ws.on('message', (message) => {
            const data = JSON.parse(message);
            if (data.type === 'command') {
              stream.write(data.command);
            }
          });
          
          stream.on('close', () => {
            ws.send(JSON.stringify({ type: 'info', message: 'Shell 会话已关闭' }));
          });
        });
      });
      
      sshClient.on('error', (err) => {
        ws.send(JSON.stringify({ type: 'error', message: '连接错误：' + err.message }));
      });
      
      sshClient.connect({
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password
      });
    }
  });

  ws.on('close', () => {
    if (sshClient) {
      sshClient.end();
    }
    console.log('WebSocket 连接已关闭');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
});