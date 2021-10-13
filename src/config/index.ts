import {
  WorkerLogTag,
  TransportListenIp,
  RtpCodecCapability,
  WorkerLogLevel,
} from 'mediasoup/node/lib/types';
import os from 'os';

const mediaSoupConfig = {
  listenIp: '0.0.0.0',
  listenPort: 3016,
  mediasoup: {
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: 10000,
      rctMaxPort: 10100,
      logLevel: 'debug' as WorkerLogLevel,
      logTags: ['info', 'ice', 'dlts', 'rtp', 'srtp', 'rtcp'] as WorkerLogTag[],
    },
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 10000,
          },
        },
      ] as RtpCodecCapability[],
    },
  },
  webRtcTransport: {
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: '127.0.0.1', // Replace by public IP address
      },
    ] as TransportListenIp[],
    maxIncomeBitrate: 150000,
    initialAvailableOutgoingBitrate: 100000,
  },
};

export { mediaSoupConfig };
