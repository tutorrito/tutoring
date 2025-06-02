import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Star } from 'lucide-react-native';

interface FavoriteButtonProps {
  tutorId: number;
  initialFavorited?: boolean;
  onToggle?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({ tutorId, initialFavorited = false, onToggle }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [scale] = useState(new Animated.Value(1));

  const handlePress = () => {
    const newState = !isFavorited;
    setIsFavorited(newState);
    onToggle?.(newState);

    // Animate the button
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      style={[styles.container, isFavorited && styles.containerActive]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Star
          size={16}
          color={isFavorited ? '#FFB800' : '#64748B'}
          fill={isFavorited ? '#FFB800' : 'transparent'}
        />
      </Animated.View>
      <Text style={[styles.text, isFavorited && styles.textActive]}>
        {isFavorited ? 'Favorited' : 'Favorite'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  containerActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FFB800',
  },
  text: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#64748B',
  },
  textActive: {
    color: '#B45309',
  },
});