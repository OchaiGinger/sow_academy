-- Existing class subjects remain required for every student by default.
ALTER TABLE "ClassSubject"
ADD COLUMN "isElective" BOOLEAN NOT NULL DEFAULT false;

-- Elective enrollment is attached to a class-subject offering, not the subject
-- globally, so the same subject can be required in one class and elective in another.
CREATE TABLE "StudentClassSubject" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentClassSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentClassSubject_studentId_classSubjectId_key"
ON "StudentClassSubject"("studentId", "classSubjectId");
CREATE INDEX "StudentClassSubject_classSubjectId_idx"
ON "StudentClassSubject"("classSubjectId");
CREATE INDEX "StudentClassSubject_studentId_idx"
ON "StudentClassSubject"("studentId");

ALTER TABLE "StudentClassSubject"
ADD CONSTRAINT "StudentClassSubject_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentClassSubject"
ADD CONSTRAINT "StudentClassSubject_classSubjectId_fkey"
FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
