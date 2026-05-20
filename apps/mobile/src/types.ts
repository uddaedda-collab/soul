export type RoomMode = 'host' | 'shared';
export type RoomVisibility = 'private' | 'public';
export type MediaProvider = 'youtube' | 'netflix' | 'drive' | 'local' | 'external' | 'upload';
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'buffering' | 'ended';
export type MessageType = 'text' | 'emoji' | 'gif' | 'sticker' | 'voice' | 'media' | 'system';

export interface AuthUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  isAdmin?: boolean;
}

export interface UserProfile extends AuthUser {
  bio?: string;
  favoriteGenres: string[];
  relationshipStatus?: 'dating' | 'engaged' | 'married' | 'private';
  online: boolean;
  pushTokens: string[];
  blockedUserIds: string[];
  watchStats: {
    totalMinutes: number;
    roomsCreated: number;
    reactionsSent: number;
    currentStreakDays: number;
  };
  reminders: Array<{
    id: string;
    title: string;
    date: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface MediaSource {
  id: string;
  provider: MediaProvider;
  title: string;
  uri: string;
  thumbnailUrl?: string;
  durationMs?: number;
  mimeType?: string;
  subtitles?: SubtitleTrack[];
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  uri: string;
}

export interface PlaybackState {
  status: PlaybackStatus;
  positionMs: number;
  speed: number;
  media?: MediaSource;
  subtitleTrackId?: string | null;
  quality?: string;
  volume?: number;
  updatedAtServerMs: number;
  updatedBy: string;
  version: number;
}

export interface RoomParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: number;
  lastSeenAt: number;
  online: boolean;
  muted: boolean;
  cameraEnabled: boolean;
}

export interface CoupleTheme {
  id: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
}

export interface WatchRoom {
  id: string;
  code: string;
  title: string;
  hostId: string;
  mode: RoomMode;
  visibility: RoomVisibility;
  inviteToken: string;
  createdAt: number;
  updatedAt: number;
  participants: Record<string, RoomParticipant>;
  playback: PlaybackState;
  theme: CoupleTheme;
}

export interface SharedMedia {
  id: string;
  roomId: string;
  senderId: string;
  storagePath: string;
  downloadUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  encryptedBody: string;
  nonce: string;
  type: MessageType;
  replyToId?: string;
  media?: SharedMedia;
  reactions: Record<string, string[]>;
  editedAt?: number;
  deletedAt?: number;
  createdAt: number;
  decryptedBody?: string;
}

export interface LiveReaction {
  id: string;
  roomId: string;
  senderId: string;
  emoji: string;
  positionMs: number;
  createdAt: number;
}

export interface SyncEnvelope {
  playback: PlaybackState;
  serverNowMs: number;
  recommendedAction: 'none' | 'soft-correct' | 'hard-seek';
  expectedPositionMs: number;
  maxAllowedDriftMs: number;
}

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  CreateRoom: undefined;
  JoinRoom: { code?: string } | undefined;
  SourcePicker: { roomId?: string };
  WatchRoom: { roomId: string };
  Profile: undefined;
};
