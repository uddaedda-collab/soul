import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import type { LiveReaction } from '../../types';

interface Props {
  reactions: LiveReaction[];
}

export function ReactionsOverlay({ reactions }: Props) {
  return (
    <>
      {reactions.slice(-8).map((reaction, index) => (
        <FloatingReaction key={reaction.id} reaction={reaction} index={index} />
      ))}
    </>
  );
}

function FloatingReaction({ reaction, index }: { reaction: LiveReaction; index: number }) {
  const { width } = useWindowDimensions();
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const left = 28 + ((index * 47) % Math.max(80, width - 96));

  useEffect(() => {
    y.value = withTiming(-180, { duration: 1900 });
    opacity.value = withSequence(withTiming(1, { duration: 120 }), withDelay(1380, withTiming(0, { duration: 380 })));
    scale.value = withSequence(withTiming(1.25, { duration: 180 }), withTiming(1, { duration: 300 }));
  }, [opacity, scale, y, reaction.id]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value
  }));

  return <Animated.Text style={[styles.reaction, { left }, style]}>{reaction.emoji}</Animated.Text>;
}

const styles = StyleSheet.create({
  reaction: {
    position: 'absolute',
    bottom: 210,
    zIndex: 15,
    fontSize: 34
  }
});
