import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';

const avatars = [
  {
    id: 1,
    name: 'Girl with Glasses',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user.svg'
  },
  {
    id: 2,
    name: 'Boy in Green',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user-2.svg'
  },
  {
    id: 3,
    name: 'Girl in Yellow',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user-3.svg'
  },
  {
    id: 4,
    name: 'Boy in Blue',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user-4.svg'
  },
  {
    id: 5,
    name: 'Fox',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/fox.svg'
  },
  {
    id: 6,
    name: 'Cat',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cat.svg'
  },
  {
    id: 7,
    name: 'Panda',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/panda.svg'
  },
  {
    id: 8,
    name: 'Dog',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/dog.svg'
  }
];

export default function AvatarSelectionScreen() {
  const handleAvatarSelect = (avatar: typeof avatars[0]) => {
    // TODO: Save selected avatar to user profile in Supabase
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Avatar</Text>
        <Text style={styles.subtitle}>Select an avatar to personalize your profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.avatarGrid}
        showsVerticalScrollIndicator={false}
      >
        {avatars.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={styles.avatarCard}
            onPress={() => handleAvatarSelect(avatar)}
          >
            <Image
              source={{ uri: avatar.url }}
              style={styles.avatarImage}
            />
            <Text style={styles.avatarName}>{avatar.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  avatarGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarCard: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
  },
});