-- Add map dimension to existing scores and keep legacy rows on Classic.
ALTER TABLE "Score" ADD COLUMN "map" TEXT NOT NULL DEFAULT 'classic';

CREATE INDEX "Score_difficulty_map_weekStart_idx" ON "Score"("difficulty", "map", "weekStart");
