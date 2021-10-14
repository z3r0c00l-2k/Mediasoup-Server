import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import setUpSocketIO from './lib/socketIO';

const PORT = 8000;

const main = async () => {
  const app = express();
  app.use(cors());
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  setUpSocketIO(io);

  app.get('/', (req, res) => {
    res.send({ hello: 'world' });
  });

  server.listen(PORT, () => {
    console.log(`Server Started On ${PORT}`);
  });
};

export default main;
