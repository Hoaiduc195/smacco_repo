/*
  Warnings:

  - You are about to drop the column `place_id` on the `conversations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_place_id_fkey";

-- DropIndex
DROP INDEX "idx_conversations_place_id";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "place_id";

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "average_rating" DOUBLE PRECISION,
ADD COLUMN     "cover_image_url" TEXT,
ADD COLUMN     "price_level" INTEGER,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "place_sources" (
    "id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "source_place_id" TEXT NOT NULL,
    "raw_name" TEXT,
    "raw_address" TEXT,
    "normalized_name" TEXT,
    "normalized_address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "user_id" UUID,
    "title" TEXT,
    "question_text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "user_id" UUID,
    "answer_text" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_votes" (
    "id" UUID NOT NULL,
    "answer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_place_references" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,

    CONSTRAINT "conversation_place_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "presences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_place_sources_place_id" ON "place_sources"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_place_sources_source_source_place_id" ON "place_sources"("source", "source_place_id");

-- CreateIndex
CREATE INDEX "idx_questions_place_id" ON "questions"("place_id");

-- CreateIndex
CREATE INDEX "idx_answers_question_id" ON "answers"("question_id");

-- CreateIndex
CREATE INDEX "idx_answer_votes_answer_id" ON "answer_votes"("answer_id");

-- CreateIndex
CREATE INDEX "idx_answer_votes_user_id" ON "answer_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_answer_votes_answer_id_user_id" ON "answer_votes"("answer_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_cpr_conversation_id" ON "conversation_place_references"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_cpr_place_id" ON "conversation_place_references"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cpr_conversation_place" ON "conversation_place_references"("conversation_id", "place_id");

-- CreateIndex
CREATE INDEX "idx_presences_place_id" ON "presences"("place_id");

-- CreateIndex
CREATE INDEX "idx_presences_user_id" ON "presences"("user_id");

-- AddForeignKey
ALTER TABLE "place_sources" ADD CONSTRAINT "place_sources_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_place_references" ADD CONSTRAINT "conversation_place_references_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_place_references" ADD CONSTRAINT "conversation_place_references_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
