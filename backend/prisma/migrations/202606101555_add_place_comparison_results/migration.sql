CREATE TABLE "place_comparison_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "message_id" UUID,
    "title" TEXT,
    "status" TEXT,
    "place_ids" TEXT[],
    "summary" TEXT,
    "recommended_place_name" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_comparison_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "place_comparison_results_message_id_key" ON "place_comparison_results"("message_id");
CREATE INDEX "idx_place_comparison_results_conversation_id" ON "place_comparison_results"("conversation_id");
CREATE INDEX "idx_place_comparison_results_created_at" ON "place_comparison_results"("created_at");

ALTER TABLE "place_comparison_results"
ADD CONSTRAINT "place_comparison_results_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "place_comparison_results"
ADD CONSTRAINT "place_comparison_results_message_id_fkey"
FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
