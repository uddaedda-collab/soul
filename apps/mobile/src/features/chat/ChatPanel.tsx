import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { registerSharedMedia } from '../../api/media';
import { Avatar } from '../../components/Avatar';
import { pickAndUploadRoomMedia } from '../media/uploadMedia';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import type { ChatMessage, WatchRoom } from '../../types';

interface Props {
  room: WatchRoom;
}

export function ChatPanel({ room }: Props) {
  const [text, setText] = useState('');
  const messages = useRoomStore((state) => state.messages);
  const sendMessage = useRoomStore((state) => state.sendMessage);
  const sendMediaMessage = useRoomStore((state) => state.sendMediaMessage);
  const setTyping = useRoomStore((state) => state.setTyping);
  const user = useAuthStore((state) => state.user);

  async function onSend() {
    const value = text.trim();
    if (!value) {
      return;
    }
    setText('');
    await sendMessage(value);
    setTyping(false);
  }

  async function onAttach() {
    if (!user) {
      return;
    }
    try {
      const uploaded = await pickAndUploadRoomMedia(room.id, user.id);
      if (!uploaded) {
        return;
      }
      const registered = await registerSharedMedia({
        roomId: room.id,
        senderId: user.id,
        storagePath: uploaded.storagePath,
        downloadUrl: uploaded.downloadUrl,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes
      });
      await sendMediaMessage(registered, text.trim() || 'Shared media');
      setText('');
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Check Firebase Storage setup and try again.');
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Room chat</Text>
        <Text style={styles.subtitle}>{Object.values(room.participants).filter((p) => p.online).length} online</Text>
      </View>
      <FlashList
        data={messages}
        estimatedItemSize={58}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} mine={item.senderId === user?.id} room={room} />}
        contentContainerStyle={styles.list}
      />
      <View style={styles.composer}>
        <Pressable style={styles.iconButton} onPress={onAttach}>
          <Ionicons name="attach" color={colors.textMuted} size={21} />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            setTyping(value.length > 0);
          }}
          placeholder="React to the scene..."
          placeholderTextColor={colors.textDim}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.send} onPress={onSend}>
          <Ionicons name="send" color={colors.white} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

function MessageBubble({ message, mine, room }: { message: ChatMessage; mine: boolean; room: WatchRoom }) {
  const participant = room.participants[message.senderId];
  return (
    <View style={[styles.messageRow, mine && styles.messageMine]}>
      {!mine ? <Avatar name={participant?.displayName ?? 'Partner'} uri={participant?.avatarUrl} size={28} /> : null}
      <View style={[styles.messageBubble, mine && styles.messageBubbleMine]}>
        {!mine ? <Text style={styles.sender}>{participant?.displayName ?? 'Partner'}</Text> : null}
        {message.media ? (
          <View style={styles.mediaPreview}>
            <Ionicons name={message.media.mimeType.startsWith('image/') ? 'image' : message.media.mimeType.startsWith('video/') ? 'videocam' : 'document'} color={colors.white} size={17} />
            <Text style={styles.mediaText}>{message.media.mimeType}</Text>
          </View>
        ) : null}
        <Text style={styles.messageText}>{message.decryptedBody || 'Encrypted message'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden'
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs
  },
  list: {
    padding: spacing.lg
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  messageMine: {
    justifyContent: 'flex-end'
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated
  },
  messageBubbleMine: {
    backgroundColor: colors.rose
  },
  sender: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20
  },
  mediaPreview: {
    minHeight: 34,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0,0,0,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs
  },
  mediaText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800'
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rose
  }
});
