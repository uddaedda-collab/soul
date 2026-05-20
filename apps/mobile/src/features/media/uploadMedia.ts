import type { FirebaseStorageTypes } from '@react-native-firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import { requireFirebaseConfig } from '../../api/firebaseConfig';
import type { SharedMedia } from '../../types';

export async function pickAndUploadRoomMedia(roomId: string, userId: string): Promise<SharedMedia | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    copyToCacheDirectory: true
  });

  if (picked.canceled || !picked.assets[0]) {
    return null;
  }

  const asset = picked.assets[0];
  const id = `${Date.now()}-${asset.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storagePath = `rooms/${roomId}/${userId}/${id}`;
  const ref = getFirebaseStorage().ref(storagePath);
  await ref.putFile(asset.uri);
  const downloadUrl = await ref.getDownloadURL();

  return {
    id,
    roomId,
    senderId: userId,
    storagePath,
    downloadUrl,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    sizeBytes: asset.size ?? 0,
    createdAt: Date.now()
  };
}

function getFirebaseStorage(): FirebaseStorageTypes.Module {
  requireFirebaseConfig();
  const storageModule = require('@react-native-firebase/storage') as {
    default: () => FirebaseStorageTypes.Module;
  };
  return storageModule.default();
}
