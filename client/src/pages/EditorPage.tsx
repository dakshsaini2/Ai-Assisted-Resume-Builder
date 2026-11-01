import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useBlocker } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Check,
  Eye,
  EyeOff,
  Download,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
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
import { resumeService, downloadResumePdf } from '../services/resumeService';
import { hasAiPrivacyConsent, setAiPrivacyConsent } from '../services/aiService';
import { AiConsentModal } from '../components/resume/AiConsentModal';
import { AiSummaryModal } from '../components/resume/AiSummaryModal';
import { AiImproveModal } from '../components/resume/AiImproveModal';
import { ResumeAnalyzer } from '../components/resume/ResumeAnalyzer';
import { JobMatcher } from '../components/resume/JobMatcher';
import { CoverLetterGenerator } from '../components/resume/CoverLetterGenerator';
import type { Resume } from '../types';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resume, setResume] = useState<Resume | null>(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const [isAiConsentModalOpen, setIsAiConsentModalOpen] = useState(false);
  const [pendingAiAction, setPendingAiAction] = useState<(() => void) | null>(null);
  const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
  const [improveModalState, setImproveModalState] = useState<{
    isOpen: boolean;
    text: string;
    onAccept: (improved: string) => void;
  }>({
    isOpen: false,
    text: '',
    onAccept: () => {},
  });

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        !isSaved && currentLocation.pathname !== nextLocation.pathname,
      [isSaved]
    )
  );

  useEffect(() => {
    if (isSaved) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaved]);

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

  const handleUpdate = (fields: Partial<Resume>) => {
    setResume((prev) => (prev ? { ...prev, ...fields } : null));
    setIsSaved(false);
  };

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

  const handleDownloadPdf = async () => {
    if (!resume || !id || isDownloadingPdf) return;

    try {
      setIsDownloadingPdf(true);

      if (!isSaved) {
        try {
          setIsSaving(true);
          const updated = await resumeService.update(id, resume);
          setResume(updated);
          setIsSaved(true);
        } catch (saveErr: any) {
          toast.error(saveErr.message || 'Failed to save changes before download.');
          setIsDownloadingPdf(false);
          setIsSaving(false);
          return;
        } finally {
          setIsSaving(false);
        }
      }

      toast.loading('Generating high-resolution PDF...', { id: 'editor-pdf-download' });
      const filename = await downloadResumePdf(id);
      toast.success(`Downloaded ${filename}`, { id: 'editor-pdf-download' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate PDF. Please try again.', {
        id: 'editor-pdf-download',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const requireAiConsent = (action: () => void) => {
    if (hasAiPrivacyConsent()) {
      action();
    } else {
      setPendingAiAction(() => action);
      setIsAiConsentModalOpen(true);
    }
  };

  const handleConfirmAiConsent = () => {
    setAiPrivacyConsent(true);
    setIsAiConsentModalOpen(false);
    if (pendingAiAction) {
      pendingAiAction();
      setPendingAiAction(null);
    }
  };

  const handleOpenAiSummary = () => {
    requireAiConsent(() => {
      setIsAiSummaryModalOpen(true);
    });
  };

  const handleOpenAiImprove = (text: string, onAccept: (improved: string) => void) => {
    requireAiConsent(() => {
      setImproveModalState({
        isOpen: true,
        text,
        onAccept,
      });
    });
  };

  const handleApplySummary = (newSummary: string) => {
    handleUpdate({ summary: newSummary });
    toast.success('Professional summary updated in editor!');
  };

  const handleApplyImprove = (improvedText: string) => {
    improveModalState.onAccept(improvedText);
    setImproveModalState((prev) => ({ ...prev, isOpen: false }));
    toast.success('Bullet point updated in editor!');
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
    <div className="min-h-screen flex flex-col bg-warm-white text-charcoal print:block print:bg-white print:min-h-0">
      <header className="no-print print:hidden sticky top-0 z-30 bg-white border-b border-gray-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
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

        <div className="flex items-center gap-2 sm:gap-3">
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            leftIcon={showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            className="hidden lg:inline-flex"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            variant={isSaved ? 'outline' : 'primary'}
            leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
          >
            {isSaved ? 'Saved' : 'Save Changes'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 text-charcoal-light" />}
            title="Print or Save as PDF via browser print dialog"
            aria-label="Print resume"
          >
            Print
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isDownloadingPdf}
            disabled={isDownloadingPdf}
            variant="secondary"
            leftIcon={<Download className="w-4 h-4 text-primary-light" />}
            title="Download high-resolution A4 PDF"
            aria-label="Download PDF"
          >
            {isDownloadingPdf ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden print:block print:overflow-visible">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          className="hidden md:flex"
        />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-3xl no-print print:hidden">
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
              <option value="ai-analyzer">ATS Analysis & Scoring</option>
              <option value="ai-job-match">Job Description Matching</option>
              <option value="ai-cover-letter">AI Cover Letter</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
            {activeSection === 'personal' && (
              <PersonalInfoForm data={resume} onChange={handleUpdate} />
            )}

            {activeSection === 'summary' && (
              <SummaryForm
                data={resume}
                onChange={handleUpdate}
                onOpenAiSummary={handleOpenAiSummary}
              />
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
                onImproveBullet={handleOpenAiImprove}
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

            {activeSection === 'ai-analyzer' && (
              <ResumeAnalyzer
                resume={resume}
                onRequireConsent={requireAiConsent}
                onSaveResume={handleSave}
                isSaved={isSaved}
              />
            )}

            {activeSection === 'ai-job-match' && (
              <JobMatcher
                resume={resume}
                onRequireConsent={requireAiConsent}
              />
            )}

            {activeSection === 'ai-cover-letter' && (
              <CoverLetterGenerator
                resume={resume}
                onRequireConsent={requireAiConsent}
              />
            )}
          </div>
        </main>

        <aside
          className={`resume-preview-aside bg-warm-gray border-l border-gray-200/80 p-5 overflow-y-auto print:!block print:!w-full print:!p-0 print:!border-none print:!m-0 print:!overflow-visible ${
            showPreview
              ? 'hidden lg:block w-[48%] xl:w-[50%]'
              : 'hidden print:!block'
          }`}
        >
          <ResumePreview
            resume={resume}
            onTemplateChange={(templateId) => handleUpdate({ templateId })}
          />
        </aside>
      </div>

      <AiConsentModal
        isOpen={isAiConsentModalOpen}
        onClose={() => {
          setIsAiConsentModalOpen(false);
          setPendingAiAction(null);
        }}
        onConfirm={handleConfirmAiConsent}
      />

      {resume && (
        <AiSummaryModal
          isOpen={isAiSummaryModalOpen}
          onClose={() => setIsAiSummaryModalOpen(false)}
          resumeId={resume.id}
          currentSummary={resume.summary}
          onApply={handleApplySummary}
        />
      )}

      <AiImproveModal
        isOpen={improveModalState.isOpen}
        onClose={() => setImproveModalState((prev) => ({ ...prev, isOpen: false }))}
        originalText={improveModalState.text}
        onApply={handleApplyImprove}
      />

      <Modal
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Unsaved Changes"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => blocker.reset?.()}
            >
              Stay on Editor
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => blocker.proceed?.()}
            >
              Discard & Leave
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-charcoal">
              You have unsaved changes
            </p>
            <p className="text-xs text-charcoal-light leading-relaxed">
              Leaving this page will discard your unsaved resume changes. Are you sure you want to exit without saving?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

