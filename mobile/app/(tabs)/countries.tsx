import { SectionList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useCountries, Country } from '@/hooks/useCountries';
import { colors, r } from '@/constants/theme';

export default function CountriesScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data: countries, isLoading, isError } = useCountries();

  const sections = useMemo(() => {
    if (!countries) return [];
    const grouped: Record<string, Country[]> = {};
    for (const c of countries) {
      if (!grouped[c.groupStage]) grouped[c.groupStage] = [];
      grouped[c.groupStage].push(c);
    }
    return Object.keys(grouped).sort().map((g) => ({ title: g, data: grouped[g] }));
  }, [countries]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>;
  if (isError)   return <View style={styles.center}><Text style={styles.error}>読み込みエラー</Text></View>;

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.code}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>GROUP</Text>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const isLast = index === section.data.length - 1;
        return (
          <TouchableOpacity
            style={[styles.row, isLast && styles.rowLast]}
            onPress={() => router.push(`/country/${item.code}`)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.pos}>{index + 1}</Text>
              <Text style={styles.flag}>{item.flagEmoji ?? '🏳️'}</Text>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.nameEn} · {item.federation}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      }}
      stickySectionHeadersEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  error: { color: colors.red, fontSize: 15 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sectionLabel: { color: colors.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  sectionTitle: { color: colors.white, fontSize: 14, fontWeight: '800' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pos: { color: colors.textMuted, fontSize: 12, width: 16, textAlign: 'center' },
  flag: { fontSize: 30 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  chevron: { color: colors.textMuted, fontSize: 20 },
});
