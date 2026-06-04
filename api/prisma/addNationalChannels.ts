import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const channels = [
  // ── 各国代表公式 ──
  { channelId: 'UCdQuDaRww5NkKpQQ1BJBWww', name: 'ブラジル代表 (CBF)' },
  { channelId: 'UCIxJJINN42QI7rxhg6xDyzw', name: 'アルゼンチン代表 (AFA)' },
  { channelId: 'UCeJlXGyEl7kBgQJKADAHM3A', name: 'フランス代表 (FFF)' },
  { channelId: 'UC7am34-1rGU_ky1vWYnoOJQ', name: 'ドイツ代表 (DFB)' },
  { channelId: 'UCJ2F8qpzHRk3RdJZ4YXLbxQ', name: 'スペイン代表 (SeFutbol)' },
  { channelId: 'UCNT2e7Og56vm5_V-yJWvglA', name: 'イングランド代表 (FA)' },
  { channelId: 'UCsIoK3XP-cVcpoCC_SdjZdg', name: 'ポルトガル代表 (FPF)' },
  { channelId: 'UCpnmJcBhJqKIHFkKvgdkdMQ', name: 'オランダ代表 (OnsOranje)' },
  { channelId: 'UCgIeUSV91-FfmCayG4lSBcw', name: '日本代表 (JFATV)' },
  { channelId: 'UCqmmurJfP4oRh4d92C6xMfQ', name: '韓国代表 (KFATV)' },
  { channelId: 'UC3D3rXIt1zy-TC_wJ3V8Z_w', name: 'メキシコ代表 (Selección Nacional)' },
  // ── サッカー系YouTuber・メディア ──
  { channelId: 'UCcbha5NcdI5P0XKytFnRaAw', name: 'r football jpn' },
  { channelId: 'UCfljGUYGmZdiTj51EQQ4wZw', name: 'footballshukyu' },
  { channelId: 'UCsWI0Iz3nnqUYl-lrjXv_6g', name: 'z-jajan' },
  { channelId: 'UCj5TPpXshJCIEw9eeGCV8sQ', name: 'gunsou720' },
  { channelId: 'UCtWE28T1qK3QXMZe75WvDoQ', name: 'foot ok rock' },
  { channelId: 'UCWW6vQR1lYIP1QSBLMxjZrA', name: 'football factory zuki' },
  { channelId: 'UCsellVUSsVts0Y1cevYey3A', name: 'サッカー系チャンネル①' },
  { channelId: 'UCQnUBMatlir9c0a1L4j7Klg', name: 'サッカー系チャンネル②' },
  { channelId: 'UCmxR1yK8bgj0L4iq86M8eSA', name: 'footballfrisk' },
];

async function main() {
  console.log(`🌍 ${channels.length}チャンネルを追加します...`);

  for (const ch of channels) {
    await prisma.youtubeChannel.upsert({
      where:  { channelId: ch.channelId },
      update: { name: ch.name, active: true },
      create: { channelId: ch.channelId, name: ch.name, active: true },
    });
    console.log(`✅ ${ch.name}`);
  }

  const total = await prisma.youtubeChannel.count();
  console.log(`\n🎉 完了！合計 ${total} チャンネル登録済み`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
