import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import WebSocketConnection from './lib/ws';

const PORT = 8000;

const main = async () => {
  const app = express();
  const server = http.createServer(app);
  const webSocket = new WebSocket.Server({ server, path: '/ws' });

  WebSocketConnection(webSocket);

  server.listen(PORT, () => {
    console.log(`Server Started On ${PORT}`);
  });
};

export default main;
