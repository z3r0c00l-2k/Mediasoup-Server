import * as mediasoup from 'mediasoup';
import { Worker, Router } from 'mediasoup/node/lib/types';
import { mediaSoupConfig } from '../config';

const workers: Array<{
  worker: Worker;
  router: Router;
}> = [];

let nextMediasoupWorkerIndex = 0;

const createMediasoupWorker = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: mediaSoupConfig.mediasoup.worker.logLevel,
    logTags: mediaSoupConfig.mediasoup.worker.logTags,
    rtcMinPort: mediaSoupConfig.mediasoup.worker.rtcMinPort,
    rtcMaxPort: mediaSoupConfig.mediasoup.worker.rctMaxPort,
  });

  worker.on('died', () => {
    console.log(
      'Mediasoup worked died exiting in 2 sec... [pid:&d]',
      worker.pid,
    );
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });

  const mediasoupRouter = await worker.createRouter({
    mediaCodecs: mediaSoupConfig.mediasoup.router.mediaCodecs,
  });

  return mediasoupRouter;
};

export { createMediasoupWorker, workers, nextMediasoupWorkerIndex };
