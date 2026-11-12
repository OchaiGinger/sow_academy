-- Add Test 3 and the 10-mark limits for all three tests.
ALTER TYPE "ScoreComponent" ADD VALUE 'TEST3';

ALTER TABLE "Score"
ADD COLUMN "test3" DOUBLE PRECISION NOT NULL DEFAULT 0;
