import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Chrome as Home, Search, Calendar, GraduationCap, User } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const icons = [Home, Search, Calendar, GraduationCap, User];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = icons[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.activeTab]}
            >
              <Icon
                size={24}
                color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
                style={[
                  styles.icon,
                  isFocused && styles.activeIcon
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1B85DB',
    borderRadius: 10,
    height: 40,
    width: 300,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.35), 5px 10px 15px rgba(27, 133, 219, 0.5)',
      }
    }),
  },
  tab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    transform: [{translateY: -3}],
  },
  icon: {
    transition: 'transform 0.3s ease-in-out',
  },
  activeIcon: {
    transform: [{scale: 1.1}],
  },
});