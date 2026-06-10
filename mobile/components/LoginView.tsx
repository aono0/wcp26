import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image, ImageBackground } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/theme';

export function LoginView() {
  const { appleLogin, devLogin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const handleApple = async () => {
    setLoading(true);
    try {
      await appleLogin();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('サインインに失敗しました', 'もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDev = async () => {
    setLoading(true);
    try {
      await devLogin();
    } catch {
      Alert.alert('開発ログイン失敗', 'ローカルAPIが起動しているか確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/login.png')}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      {/* 暗いオーバーレイで画像をうっすら見せる */}
      <View style={styles.overlay} />
      <View style={styles.hero}>
        <Image source={require('../assets/images/icon.png')} style={styles.appIcon} />
        <Text style={styles.eyebrow}>USA · CANADA · MEXICO</Text>
        <Text style={styles.titleSub}>Your team, your moment.</Text>
        <Text style={styles.title}>Never miss a match</Text>
      </View>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.gold} />
        ) : (
          <>
            {appleAvailable ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={12}
                style={styles.appleBtn}
                onPress={handleApple}
              />
            ) : (
              <View style={styles.appleBtnFallback}>
                <Text style={styles.appleBtnFallbackText}> Sign in with Apple</Text>
              </View>
            )}
            {__DEV__ && (
              <TouchableOpacity style={styles.devBtn} onPress={handleDev}>
                <Text style={styles.devBtnText}>開発用ログイン（DEVのみ）</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.note}>
              サインインすると利用規約とプライバシーポリシーに同意したものとみなされます。
            </Text>
          </>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  bgImage: { opacity: 0.28, resizeMode: 'cover', height: '115%', width: '120%', top: -170, left: -20 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,13,30,0.6)' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  appIcon: { width: 96, height: 96, borderRadius: 22, marginBottom: 24 },
  eyebrow: { color: colors.textMuted, fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  title: { color: colors.gold, fontSize: 34, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', lineHeight: 40 },
  titleSub: { color: colors.white, fontSize: 34, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', lineHeight: 40 },
  footer: { paddingHorizontal: 24, paddingBottom: 48, gap: 16 },
  appleBtn: { height: 52, width: '100%' },
  appleBtnFallback: { height: 52, width: '100%', backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appleBtnFallbackText: { color: '#000', fontSize: 19, fontWeight: '600' },
  devBtn: { alignItems: 'center', paddingVertical: 10 },
  devBtnText: { color: colors.textMuted, fontSize: 13 },
  note: { color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
