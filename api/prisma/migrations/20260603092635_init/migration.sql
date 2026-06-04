-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "appleUserId" TEXT,
    "devUserId" TEXT,
    "pushToken" TEXT,
    "notifyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sex" TEXT,
    "ageGroup" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "flagEmoji" TEXT,
    "groupStage" TEXT NOT NULL,
    "federation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameJa" TEXT,
    "countryId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "imageUrl" TEXT,
    "clubTeam" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "number" INTEGER,
    "goalCount" INTEGER NOT NULL DEFAULT 0,
    "assistCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "venueCity" TEXT,
    "round" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'GROUP',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "homePlaceholder" TEXT,
    "awayPlaceholder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryMatch" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isHome" BOOLEAN NOT NULL DEFAULT true,
    "score" INTEGER,
    "result" TEXT,

    CONSTRAINT "CountryMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeChannel" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YoutubeChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "description" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "channelId" TEXT NOT NULL,
    "isShort" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryNews" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "CountryNews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_appleUserId_key" ON "User"("appleUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_devUserId_key" ON "User"("devUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_countryId_key" ON "UserFavorite"("userId", "countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Player_countryId_idx" ON "Player"("countryId");

-- CreateIndex
CREATE INDEX "Player_goalCount_idx" ON "Player"("goalCount");

-- CreateIndex
CREATE INDEX "Player_assistCount_idx" ON "Player"("assistCount");

-- CreateIndex
CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_stage_status_idx" ON "Match"("stage", "status");

-- CreateIndex
CREATE INDEX "CountryMatch_countryId_idx" ON "CountryMatch"("countryId");

-- CreateIndex
CREATE INDEX "CountryMatch_matchId_idx" ON "CountryMatch"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "CountryMatch_matchId_countryId_key" ON "CountryMatch"("matchId", "countryId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchNotification_userId_matchId_key" ON "MatchNotification"("userId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeChannel_channelId_key" ON "YoutubeChannel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoId_key" ON "Video"("videoId");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt");

-- CreateIndex
CREATE INDEX "Video_channelId_publishedAt_idx" ON "Video"("channelId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CountryNews_newsId_countryId_key" ON "CountryNews"("newsId", "countryId");

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryMatch" ADD CONSTRAINT "CountryMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryMatch" ADD CONSTRAINT "CountryMatch_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchNotification" ADD CONSTRAINT "MatchNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchNotification" ADD CONSTRAINT "MatchNotification_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "YoutubeChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryNews" ADD CONSTRAINT "CountryNews_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryNews" ADD CONSTRAINT "CountryNews_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
