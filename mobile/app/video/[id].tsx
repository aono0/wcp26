import { StyleSheet, Text, View, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import WebView from 'react-native-webview';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round(width * 9 / 16);

export default function VideoPlayerScreen() {
  const { id: videoId, title } = useLocalSearchParams<{ id: string; title: string }>();

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <>
      <Stack.Screen options={{
        title: '',
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: colors.gold,
        headerShadowVisible: false,
        headerBackTitle: '戻る',
      }} />
      <View style={styles.container}>
        {/* YouTube プレイヤー */}
        <View style={[styles.playerWrap, { height: VIDEO_HEIGHT }]}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.webview}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
          />
        </View>

        {/* タイトルと外部リンク */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={3}>{decodeURIComponent(title ?? '')}</Text>
          <TouchableOpacity style={styles.ytBtn} onPress={() => Linking.openURL(youtubeUrl)}>
            <Text style={styles.ytBtnText}>▶  YouTubeで開く</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  playerWrap: { width: '100%', backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  info: { padding: 16, backgroundColor: colors.bg, flex: 1 },
  title: { color: colors.white, fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 16 },
  ytBtn: {
    flexDirection: 'row', alignSelf: 'flex-start',
    backgroundColor: '#FF0000', borderRadius: 6,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  ytBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
