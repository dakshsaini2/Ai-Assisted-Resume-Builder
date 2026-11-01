import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Check,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { Sidebar } from '../components/layout/Sidebar';
import { PersonalInfoForm } from '../components/resume/PersonalInfoForm';
import { SummaryForm } from '../components/resume/SummaryForm';
import { EducationForm } from '../components/resume/EducationForm';
import { ExperienceForm } from '../components/resume/ExperienceForm';
import { ProjectsForm } from '../components/resume/ProjectsForm';
import { SkillsForm } from '../components/resume/SkillsForm';
import { CertificationsForm } from '../components/resume/CertificationsForm';
import { AchievementsForm } from '../components/resume/AchievementsForm';
import { LanguagesForm } from '../components/resume/LanguagesForm';
import { ResumePreview } from '../components/resume/ResumePreview';
import { resumeService } from '../services/resumeService';
import type { Resume } from '../types';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resume, setResume] = useState<Resume | null>(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Fetch resume data
  const loadResume = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await resumeService.getById(id);
      setResume(data);
      setIsSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load resume.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadResume();
  }, [loadResume]);

  // Update in-memory resume state
  const handleUpdate = (fields: Partial<Resume>) => {
    setResume((prev) => (prev ? { ...prev, ...fields } : null));
    setIsSaved(false);
  };

  // Save to database
  const handleSave = async () => {
    if (!resume || !id) return;
    try {
      setIsSaving(true);
      const updated = await resumeService.update(id, resume);
      setResume(updated);
      setIsSaved(true);
      toast.success('Resume saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <LoadingState message="Loading your resume editor..." />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-warm-white p-8 flex items-center justify-center">
        <ErrorState
          title="Resume Not Found"
          message={error || "The requested resume could not be found or you don't have permission to view it."}
          onRetry={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-white text-charcoal">
      {/* Top Header Toolbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-lg text-gray-400 hover:text-charcoal hover:bg-gray-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <input
              type="text"
              value={resume.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="text-base font-bold text-charcoal bg-transparent hover:bg-gray-50 focus:bg-white rounded px-2 py-0.5 border border-transparent focus:border-gray-300 focus:outline-none transition-colors"
              title="Click to rename"
            />
          </div>
        </div>

        {/* Template Selector & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Template Selector */}
          <div className="hidden sm:flex items-center bg-gray-100/80 p-0.5 rounded-lg border border-gray-200 text-xs">
            {(['classic', 'modern', 'creative'] as const).map((tId) => (
              <button
                key={tId}
                onClick={() => handleUpdate({ templateId: tId })}
                className={`px-3 py-1 rounded-md font-medium capitalize cursor-pointer transition-all ${
                  resume.templateId === tId
                    ? 'bg-white text-charcoal shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-charcoal'
                }`}
              >
                {tId}
              </button>
            ))}
          </div>

          {/* Toggle Live Preview */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            leftIcon={showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            className="hidden lg:inline-flex"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          {/* Save Button */}
          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            variant={isSaved ? 'outline' : 'primary'}
            leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
          >
            {isSaved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Main Workspace: Sidebar + Form Content + Live Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          className="hidden md:flex"
        />

        {/* Center Editing Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-3xl">
          {/* Mobile section selector dropdown */}
          <div className="block md:hidden mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Jump to Section
            </label>
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm font-medium"
            >
              <option value="personal">Personal Information</option>
              <option value="summary">Professional Summary</option>
              <option value="experience">Work Experience</option>
              <option value="education">Education</option>
              <option value="projects">Projects</option>
              <option value="skills">Technical Skills</option>
              <option value="certifications">Certifications</option>
              <option value="achievements">Achievements</option>
              <option value="languages">Languages</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
            {activeSection === 'personal' && (
              <PersonalInfoForm data={resume} onChange={handleUpdate} />
            )}

            {activeSection === 'summary' && (
              <SummaryForm data={resume} onChange={handleUpdate} />
            )}

            {activeSection === 'education' && (
              <EducationForm
                items={resume.education || []}
                onChange={(education) => handleUpdate({ education })}
              />
            )}

            {activeSection === 'experience' && (
              <ExperienceForm
                items={resume.experiences || []}
                onChange={(experiences) => handleUpdate({ experiences })}
              />
            )}

            {activeSection === 'projects' && (
              <ProjectsForm
                items={resume.projects || []}
                onChange={(projects) => handleUpdate({ projects })}
              />
            )}

            {activeSection === 'skills' && (
              <SkillsForm
                items={resume.skills || []}
                onChange={(skills) => handleUpdate({ skills })}
              />
            )}

            {activeSection === 'certifications' && (
              <CertificationsForm
                items={resume.certifications || []}
                onChange={(certifications) => handleUpdate({ certifications })}
              />
            )}

            {activeSection === 'achievements' && (
              <AchievementsForm
                items={resume.achievements || []}
                onChange={(achievements) => handleUpdate({ achievements })}
              />
            )}

            {activeSection === 'languages' && (
              <LanguagesForm
                items={resume.languages || []}
                onChange={(languages) => handleUpdate({ languages })}
              />
            )}

            {/* AI Tools Info Panels (Will be fully integrated in Phase 6) */}
            {activeSection.startsWith('ai-') && (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-primary flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-charcoal capitalize">
                  {activeSection.replace('ai-', '').replace('-', ' ')} Tool
                </h3>
                <p className="text-sm text-charcoal-light max-w-md mx-auto">
                  This intelligent tool analyzes your resume data using Google Gemini to provide instant actionable feedback and tailored documents.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveSection('personal')}
                  variant="outline"
                >
                  Back to Editing Content
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Right Live A4 Resume Preview Panel */}
        {showPreview && (
          <aside className="hidden lg:block w-[48%] xl:w-[50%] bg-warm-gray border-l border-gray-200/80 p-6 overflow-y-auto">
            <div className="sticky top-0 mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Live A4 Preview ({resume.templateId})
              </span>
              <span className="text-[11px] text-gray-400">
                Real-time updates
              </span>
            </div>
            <div className="scale-95 origin-top transition-transform">
              <ResumePreview resume={resume} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
