import { StyleSheet, Text, View, TouchableOpacity, Switch, Alert, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { colors, r } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/me').then((res) => setNotifyEnabled(res.data.notifyEnabled)).catch(() => {});
  }, []);

  const toggleNotify = async (value: boolean) => {
    setNotifyEnabled(value);
    try {
      await api.put('/users/notify', { enabled: value });
    } catch {
      setNotifyEnabled(!value);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウントを削除',
      'お気に入り・設定データがすべて削除されます。この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete('/users/me');
              logout();
              router.dismissAll();
            } catch {
              Alert.alert('エラー', '削除に失敗しました。もう一度お試しください。');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* 通知設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>🔔</Text>
            <View>
              <Text style={styles.rowLabel}>試合前日通知</Text>
              <Text style={styles.rowSub}>お気に入りチームの試合前日の朝に通知</Text>
            </View>
          </View>
          <Switch
            value={notifyEnabled}
            onValueChange={toggleNotify}
            trackColor={{ false: colors.border, true: colors.gold }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* アカウント */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <TouchableOpacity style={styles.row} onPress={() => { logout(); router.dismissAll(); }}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>🚪</Text>
            <Text style={styles.rowLabel}>サインアウト</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, styles.rowDanger]} onPress={handleDeleteAccount} disabled={loading}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>🗑️</Text>
            <Text style={[styles.rowLabel, styles.rowLabelDanger]}>アカウントを削除</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 法的情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>法的情報</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL('https://aono0.github.io/wcp26/privacy.html')}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.rowIcon}>📄</Text>
            <Text style={styles.rowLabel}>プライバシーポリシー</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>WCP26 v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 16 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: colors.textSec, fontSize: 14 },
  title: { color: colors.white, fontSize: 17, fontWeight: '700' },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: r.md, padding: 14, marginBottom: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  rowDanger: { borderColor: '#3B1A1A' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon: { fontSize: 20 },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  rowLabelDanger: { color: colors.red },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.textMuted, fontSize: 20 },
  version: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 40 },
});
