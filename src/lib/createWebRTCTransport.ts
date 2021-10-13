import { Router } from 'mediasoup/node/lib/types';
import { mediaSoupConfig } from '../config';

const createWebRTCTransport = async (mediasoupRouter: Router) => {
  const { listenIps, initialAvailableOutgoingBitrate, maxIncomeBitrate } =
    mediaSoupConfig.webRtcTransport;

  const transport = await mediasoupRouter.createWebRtcTransport({
    listenIps,
    initialAvailableOutgoingBitrate,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  try {
    await transport.setMaxIncomingBitrate(maxIncomeBitrate);
  } catch (error) {
    console.error(error);
  }

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    },
  };
};

export default createWebRTCTransport;
