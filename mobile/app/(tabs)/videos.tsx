import {
  FlatList, StyleSheet, Text, View, Image,
  ActivityIndicator, Dimensions, TouchableOpacity, Linking,
} from 'react-native';
import { useState, useCallback } from 'react';
import WebView from 'react-native-webview';
import { useVideos, Video } from '@/hooks/useVideos';
import { colors } from '@/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// 9:16 縦型プレイヤーの高さ（画面幅を基準）
const PLAYER_H = Math.round(SW * 16 / 9);

export default function VideosScreen() {
  const [containerHeight, setContainerHeight] = useState(0);
  const [activeIndex, setActiveIndex]         = useState(0);
  const { data: videos, isLoading }           = useVideos(undefined, 50);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  }, []);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>;
  }

  if (!videos || videos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🎬</Text>
        <Text style={styles.emptyTitle}>動画がまだありません</Text>
        <Text style={styles.emptyText}>しばらくすると動画が表示されます</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {containerHeight > 0 && (
        <FlatList
          data={videos}
          keyExtractor={(v) => v.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={containerHeight}
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <VideoItem
              video={item}
              isActive={index === activeIndex}
              height={containerHeight}
            />
          )}
        />
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
// 1件分の動画アイテム
// ──────────────────────────────────────────────
function VideoItem({ video, isActive, height }: { video: Video; isActive: boolean; height: number }) {
  const [hasError, setHasError] = useState(false);
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const shortsUrl  = `https://www.youtube.com/shorts/${video.videoId}`;

  const showPlayer = isActive && video.isShort && !hasError;

  return (
    <View style={[styles.item, { height }]}>
      {/* 背景サムネイル（常時表示） */}
      <Image
        source={{ uri: video.thumbnail }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={20}
      />
      <View style={styles.dimLayer} />

      {/* プレイヤーエリア */}
      <View style={styles.playerWrap}>
        {showPlayer ? (
          // ✅ Shorts → WebView で縦型再生（スクロール無効でFlatListの操作を優先）
          <WebView
            source={{ uri: shortsUrl }}
            style={{ width: SW, height: PLAYER_H }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            javaScriptEnabled
            scrollEnabled={false}          // ← FlatListのスクロールを奪わない
            onError={() => setHasError(true)}
          />
        ) : (
          // 横動画 or 非アクティブ → サムネイルのみ
          <View style={{ width: SW, height: PLAYER_H }}>
            <Image
              source={{ uri: video.thumbnail }}
              style={{ width: SW, height: PLAYER_H }}
              resizeMode="cover"
            />
            {/* 横動画の場合: YouTubeで開くボタン */}
            {isActive && !video.isShort && (
              <View style={styles.horizontalOverlay}>
                <Text style={styles.horizontalLabel}>⬛ 横型動画</Text>
                <TouchableOpacity style={styles.ytBtn} onPress={() => Linking.openURL(youtubeUrl)}>
                  <Text style={styles.ytBtnText}>▶ YouTubeで見る</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Shorts だが非アクティブ: 再生ボタン */}
            {!isActive && video.isShort && (
              <View style={styles.playOverlay}>
                <View style={styles.playCircle}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 動画情報 */}
      <View style={styles.infoWrap}>
        <Text style={styles.channelName}>{video.channel.name}</Text>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.videoDate}>{relativeDate(video.publishedAt)}</Text>
      </View>
    </View>
  );
}

function relativeDate(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor(diff / 60000);
  if (days > 0)  return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (mins > 0)  return `${mins}分前`;
  return 'たった今';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },

  item: { width: SW, backgroundColor: '#000', justifyContent: 'flex-start' },
  dimLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  playerWrap: { height: PLAYER_H, overflow: 'hidden', backgroundColor: '#000' },

  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 26, marginLeft: 4 },

  horizontalOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', gap: 14 },
  horizontalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  ytBtn: { backgroundColor: '#FF0000', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 6 },
  ytBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  infoWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  channelName: { color: colors.gold, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  videoTitle: { color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18, marginBottom: 3 },
  videoDate: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
});
