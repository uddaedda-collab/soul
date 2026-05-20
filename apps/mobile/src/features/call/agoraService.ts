import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine
} from 'react-native-agora';
import { AGORA_APP_ID } from '../../api/config';

let engine: IRtcEngine | null = null;

export function getAgoraEngine() {
  if (!AGORA_APP_ID) {
    return null;
  }
  if (!engine) {
    engine = createAgoraRtcEngine();
    engine.initialize({ appId: AGORA_APP_ID });
    engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
    engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    engine.enableAudio();
    engine.enableVideo();
  }
  return engine;
}

export async function joinAgoraRoom(roomId: string, uid: number, token?: string) {
  const rtc = getAgoraEngine();
  if (!rtc) {
    return false;
  }
  rtc.joinChannel(token ?? '', roomId, uid, {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster
  });
  return true;
}

export function leaveAgoraRoom() {
  engine?.leaveChannel();
}

export function setAgoraMuted(muted: boolean) {
  engine?.muteLocalAudioStream(muted);
}

export function setAgoraCameraEnabled(enabled: boolean) {
  engine?.muteLocalVideoStream(!enabled);
}
