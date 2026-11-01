-- CreateIndex
CREATE INDEX "achievements_resume_id_idx" ON "achievements"("resume_id");

-- CreateIndex
CREATE INDEX "certifications_resume_id_idx" ON "certifications"("resume_id");

-- CreateIndex
CREATE INDEX "cover_letters_user_id_updated_at_idx" ON "cover_letters"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "cover_letters_resume_id_idx" ON "cover_letters"("resume_id");

-- CreateIndex
CREATE INDEX "education_resume_id_idx" ON "education"("resume_id");

-- CreateIndex
CREATE INDEX "experiences_resume_id_idx" ON "experiences"("resume_id");

-- CreateIndex
CREATE INDEX "job_matches_resume_id_idx" ON "job_matches"("resume_id");

-- CreateIndex
CREATE INDEX "languages_resume_id_idx" ON "languages"("resume_id");

-- CreateIndex
CREATE INDEX "projects_resume_id_idx" ON "projects"("resume_id");

-- CreateIndex
CREATE INDEX "resume_analyses_resume_id_idx" ON "resume_analyses"("resume_id");

-- CreateIndex
CREATE INDEX "resumes_user_id_updated_at_idx" ON "resumes"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "skills_resume_id_idx" ON "skills"("resume_id");

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
