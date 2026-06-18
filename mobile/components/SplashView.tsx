import { View, Text, StyleSheet, Image, ImageBackground, StatusBar } from 'react-native';
import { colors } from '@/constants/theme';

export function SplashView() {
  return (
    <ImageBackground
      source={require('../assets/images/login2.png')}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />
      <View style={styles.hero}>
        <Image source={require('../assets/images/icon3.png')} style={styles.appIcon} />
        <Text style={styles.eyebrow}>USA · CANADA · MEXICO</Text>
        <Text style={styles.titleSub}>Your team, your moment.</Text>
        <Text style={styles.title}>Never miss a match</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bgImage: { opacity: 0.28, resizeMode: 'cover', height: '115%', width: '120%', top: -170, left: -20 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,13,30,0.6)' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  appIcon: { width: 96, height: 96, borderRadius: 22, marginBottom: 24 },
  eyebrow: { color: colors.textMuted, fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  titleSub: { color: colors.white, fontSize: 34, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', lineHeight: 40 },
  title: { color: colors.gold, fontSize: 34, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', lineHeight: 40 },
});
