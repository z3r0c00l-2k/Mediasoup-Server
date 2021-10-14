import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import {
  Router,
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
} from 'mediasoup/node/lib/types';
import { createMediasoupWorker } from './worker';
import createWebRTCTransport from './createWebRTCTransport';

// eslint-disable-next-line no-unused-vars
type ResponseHandler = (resp: any) => void;

let mediasoupRouter: Router;
let producerTransport: Transport;
let consumerTransport: Transport;
let producer: Producer;
let consumer: Consumer;

const setUpSocketIO = async (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>,
) => {
  try {
    mediasoupRouter = await createMediasoupWorker();
  } catch (error: any) {
    console.log('Error on creating mediasoup workers', error);
    throw error;
  }

  io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    socket.on(
      'getRouterRtpCapabilities',
      (payload: any, response: ResponseHandler) => {
        if (response) {
          response(mediasoupRouter.rtpCapabilities);
        }
      },
    );

    socket.on(
      'createProducerTransport',
      async (payload: any, response: ResponseHandler) => {
        try {
          const { params, transport } = await createWebRTCTransport(
            mediasoupRouter,
          );
          producerTransport = transport;
          response(params);
        } catch (error) {
          console.error(error);
          response({ error: (error as Error).message });
        }
      },
    );

    socket.on(
      'connectProducerTransport',
      async (payload: any, response: ResponseHandler) => {
        await producerTransport.connect({
          dtlsParameters: payload.dtlsParameters,
        });
        response({ status: true, message: 'Producer Connected !!' });
      },
    );

    socket.on('produce', async (payload: any, response: ResponseHandler) => {
      const { kind, rtpParameters } = payload;
      producer = await producerTransport.produce({ kind, rtpParameters });
      response({ id: producer.id });

      // TODO: Broadcast message here
    });

    socket.on(
      'createConsumerTransport',
      async (payload: any, response: ResponseHandler) => {
        try {
          const { transport, params } = await createWebRTCTransport(
            mediasoupRouter,
          );
          consumerTransport = transport;
          response(params);
        } catch (error) {
          response({ error: (error as Error).message });
          console.error(error);
        }
      },
    );

    socket.on(
      'connectConsumerTransport',
      async (payload: any, response: ResponseHandler) => {
        try {
          await consumerTransport.connect({
            dtlsParameters: payload.dtlsParameters,
          });
          response({ status: true, message: 'Consumer Transport Connected' });
        } catch (error) {
          response({ error: (error as Error).message });
          console.error('Error on Subscribing', error);
        }
      },
    );

    socket.on('resume', async (payload: any, response: ResponseHandler) => {
      await consumer.resume();
      response({ message: 'Resumed' });
    });

    socket.on('consume', async (payload: any, response: ResponseHandler) => {
      const res = await createConsumer(producer, payload.rtpCapabilities);
      response(res);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

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
};

export default setUpSocketIO;
