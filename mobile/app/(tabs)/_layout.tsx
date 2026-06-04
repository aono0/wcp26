import { SymbolView } from 'expo-symbols';
import { Tabs, usePathname } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { BottomTabBarButtonProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { colors } from '@/constants/theme';

// マイチームタブ専用ボタン
function TeamTabButton({ onPress, onLongPress }: BottomTabBarButtonProps) {
  // usePathname で選択状態を確実に検知
  const pathname = usePathname();
  const focused = pathname.includes('favorites');

  return (
    <TouchableOpacity
      onPress={onPress ?? undefined}
      onLongPress={onLongPress ?? undefined}
      style={styles.outer}
      activeOpacity={0.85}
    >
      {/* transform でアイコンだけ上に浮かせる（ラベルの位置は変わらない） */}
      <View style={[styles.circle, focused && styles.circleFocused]}>
        <SymbolView
          name="trophy.fill"
          tintColor={focused ? '#7A4F00' : '#fff'}
          size={34}
        />
      </View>
      <Text style={[styles.label, focused && styles.labelFocused]}>マイチーム</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <SymbolView name="house.fill" tintColor={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: '動画',
          tabBarIcon: ({ color }) => <SymbolView name="play.rectangle.fill" tintColor={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'マイチーム',
          tabBarButton: (props) => <TeamTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: '試合・順位',
          tabBarIcon: ({ color }) => <SymbolView name="list.bullet.clipboard.fill" tintColor={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="countries"
        options={{
          title: '出場国',
          headerShown: true,
          headerTitle: 'WC2026 出場国',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.white,
          headerShadowVisible: false,
          tabBarIcon: ({ color }) => <SymbolView name="globe" tintColor={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,  // tabBarStyle の paddingBottom に合わせる
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    opacity: 0.8,
    transform: [{ translateY: 1 }], // ラベル位置に影響せずアイコンだけ上へ
  },
  circleFocused: {
    opacity: 1,
    shadowOpacity: 0.65,
    shadowRadius: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  labelFocused: {
    color: colors.gold,
  },
});
