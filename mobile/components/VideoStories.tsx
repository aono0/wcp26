import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useVideos } from '@/hooks/useVideos';
import { colors } from '@/constants/theme';

const CIRCLE_SIZE = 68;

export function VideoStories() {
  const router = useRouter();
  const { data: videos } = useVideos(undefined, 10);

  const shorts = videos?.filter((v) => v.isShort).slice(0, 8) ?? [];
  if (shorts.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {shorts.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={styles.item}
            onPress={() => router.push({ pathname: '/(tabs)/videos', params: { startId: video.videoId } })}
            activeOpacity={0.8}
          >
            <View style={styles.ring}>
              <Image
                source={{ uri: video.thumbnail }}
                style={styles.thumb}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {video.title}
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
  playOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 8, marginLeft: 1 },
  label: {
    color: colors.textSec,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
    width: CIRCLE_SIZE + 8,
  },
});
