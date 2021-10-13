import {
  Consumer,
  Producer,
  Router,
  Transport,
  RtpCapabilities,
} from 'mediasoup/node/lib/types';
import WebSocket from 'ws';
import createWebRTCTransport from './createWebRTCTransport';
import { createMediasoupWorker } from './worker';

let mediasoupRouter: Router;
let producerTransport: Transport;
let consumerTransport: Transport;
let producer: Producer;
let consumer: Consumer;

const WebSocketConnection = async (webSocket: WebSocket.Server) => {
  try {
    mediasoupRouter = await createMediasoupWorker();
  } catch (error: any) {
    console.log('Error on creating mediasoup workers', error);
    throw error;
  }

  webSocket.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
      const event = parseJson(message);

      if (!event) {
        console.error('Json Error', message);
        return;
      }

      switch (event.type) {
        case 'getRouterRtpCapabilities':
          onRouterRtpCapabilities(event, ws);
          break;
        case 'createProducerTransport':
          onCreateProducerTransport(event, ws);
          break;
        case 'connectProducerTransport':
          onConnectProducerTransport(event, ws);
          break;
        case 'produce':
          onProduce(event, ws, webSocket);
          break;
        case 'createConsumerTransport':
          onCreateConsumerTransport(event, ws);
          break;
        case 'connectConsumerTransport':
          onConnectConsumerTransport(event, ws);
          break;
        case 'resume':
          onResume(event, ws);
          break;
        case 'consume':
          onConsume(event, ws);
          break;
        default:
          break;
      }
    });
  });
};

const onRouterRtpCapabilities = (event: string, ws: WebSocket) => {
  sendMessage(ws, 'routerCapability', mediasoupRouter.rtpCapabilities);
};

const onCreateProducerTransport = async (event: string, ws: WebSocket) => {
  try {
    const { params, transport } = await createWebRTCTransport(mediasoupRouter);
    producerTransport = transport;
    sendMessage(ws, 'producerTransportCreated', params);
  } catch (error) {
    console.error(error);
    sendMessage(ws, 'Error', error);
  }
};

const onConnectProducerTransport = async (event: any, ws: WebSocket) => {
  await producerTransport.connect({ dtlsParameters: event.dtlsParameters });
  sendMessage(ws, 'producerConnected', 'Producer Connected !!');
};

const onProduce = async (
  event: any,
  ws: WebSocket,
  webSocket: WebSocket.Server,
) => {
  const { kind, rtpParameters } = event;
  producer = await producerTransport.produce({ kind, rtpParameters });

  sendMessage(ws, 'produced', { id: producer.id });
  broadcastMessage(webSocket, 'newProducer', 'New User');
};

const onCreateConsumerTransport = async (event: string, ws: WebSocket) => {
  try {
    const { transport, params } = await createWebRTCTransport(mediasoupRouter);
    consumerTransport = transport;
    sendMessage(ws, 'subTransportCreated', params);
  } catch (error) {
    console.error(error);
  }
};

const onConnectConsumerTransport = async (event: any, ws: WebSocket) => {
  try {
    console.log({ event });

    await consumerTransport.connect({ dtlsParameters: event.dtlsParameter });
    sendMessage(ws, 'subConnected', 'Consumer Transport Connected');
  } catch (error) {
    console.error('Error on Subscribing', error);
  }
};

const onConsume = async (event: any, ws: WebSocket) => {
  const res = await createConsumer(producer, event.rtpCapabilities);

  sendMessage(ws, 'subscribed', res);
};

const parseJson = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return false;
  }
};

const onResume = async (event: any, ws: WebSocket) => {
  await consumer.resume();
  sendMessage(ws, 'resumed', 'Resumed');
};

const sendMessage = (ws: WebSocket, type: string, msg: any) => {
  const message = { type, data: msg };

  console.log('Sending Message', message);

  ws.send(JSON.stringify(message));
};

const broadcastMessage = (ws: WebSocket.Server, type: string, msg: any) => {
  const message = { type, data: msg };

  const parsedMessage = JSON.stringify(message);

  ws.clients.forEach((client) => {
    client.send(parsedMessage);
  });
};

const createConsumer = async (
  producerNN: Producer,
  rtpCapabilities: RtpCapabilities,
) => {
  if (
    !mediasoupRouter.canConsume({ rtpCapabilities, producerId: producer.id })
  ) {
    console.error('Cannot Consume');
    return;
  }

  try {
    consumer = await consumerTransport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: producer.kind === 'video',
    });
  } catch (error) {
    console.error('Consume Failed', error);
    return;
  }

  return {
    producerId: producer.id,
    id: consumer.id,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    type: consumer.type,
    producerPaused: consumer.producerPaused,
  };
};

export default WebSocketConnection;
