import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const channels = [
  { channelId: 'UCbkIpRMMXHw9WC_APVRZ_0w', name: 'サッカーキング Japan' },
  { channelId: 'UCpcTrCXblq78GZrTUTLWeBw', name: 'FIFA' },
  { channelId: 'UCD2uiFEdq1heBvUg_XcWFIQ', name: 'Goal Japan' },
  { channelId: 'UCgy61I2fovjHjh9luqM-0jw', name: '日本サッカー協会（JFA）' },
  { channelId: 'UCyeDNNizMGbVsn_8Ttc3FIw', name: 'DAZN Japan' },
  { channelId: 'UC4Yw_P52Q8UwjAcLJCbRcYw', name: 'shunfreestyle' },
];

async function main() {
  for (const ch of channels) {
    await prisma.youtubeChannel.upsert({
      where:  { channelId: ch.channelId },
      update: { name: ch.name },
      create: { channelId: ch.channelId, name: ch.name },
    });
    console.log(`✅ ${ch.name}`);
  }
  console.log('🎉 チャンネル登録完了');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
