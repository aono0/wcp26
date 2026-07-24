import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { TEAM_KITS } from '@/constants/teamKits';
import { colors } from '@/constants/theme';

const CIRCLE_SIZE = 68;

export function KitStories() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {TEAM_KITS.map((team) => (
          <TouchableOpacity
            key={team.code}
            style={styles.item}
            onPress={() =>
              router.push({ pathname: '/(tabs)/kits', params: { code: team.code } })
            }
            activeOpacity={0.8}
          >
            <View style={styles.ring}>
              {team.home.imageUrl ? (
                <Image
                  source={{ uri: team.home.imageUrl }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumb, styles.placeholder]}>
                  <Text style={styles.flag}>{team.flag}</Text>
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {team.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 16,
    marginBottom: 4,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'flex-start',
  },
  item: {
    alignItems: 'center',
    width: CIRCLE_SIZE + 8,
  },
  ring: {
    width: CIRCLE_SIZE + 4,
    height: CIRCLE_SIZE + 4,
    borderRadius: (CIRCLE_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 2,
    marginBottom: 6,
  },
  thumb: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.surfaceAlt,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 32,
  },
  label: {
    color: colors.textSec,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
    width: CIRCLE_SIZE + 8,
  },
});
