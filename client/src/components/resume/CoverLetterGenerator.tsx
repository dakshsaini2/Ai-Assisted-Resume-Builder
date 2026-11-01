import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Sparkles,
  Save,
  Copy,
  Check,
  Trash2,
  Edit3,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Loader2,
  Info,
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Modal } from '../common/Modal';
import { aiService, getAiErrorMessage } from '../../services/aiService';
import type {
  Resume,
  CoverLetterRecord,
  CoverLetterTone,
  GeneratedCoverLetterDraft,
} from '../../types';

interface CoverLetterGeneratorProps {
  resume: Resume;
  onRequireConsent: (action: () => void) => void;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  resume,
  onRequireConsent,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');

  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<CoverLetterTone>('professional');
  const [customInstructions, setCustomInstructions] = useState('');

  const [draft, setDraft] = useState<GeneratedCoverLetterDraft | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const [savedLetters, setSavedLetters] = useState<CoverLetterRecord[]>([]);
  const [filterByResume, setFilterByResume] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [selectedLetter, setSelectedLetter] = useState<CoverLetterRecord | null>(null);
  const [editingLetterContent, setEditingLetterContent] = useState('');
  const [isUpdatingLetter, setIsUpdatingLetter] = useState(false);
  const [copiedSavedId, setCopiedSavedId] = useState<string | null>(null);

  const [letterToDelete, setLetterToDelete] = useState<CoverLetterRecord | null>(null);
  const [isDeletingLetter, setIsDeletingLetter] = useState(false);

  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  const descLength = jobDescription.trim().length;
  const isDescValid = descLength >= 20 && descLength <= 8000;
  const isFormValid =
    companyName.trim().length > 0 &&
    companyName.trim().length <= 100 &&
    jobRole.trim().length > 0 &&
    jobRole.trim().length <= 100 &&
    isDescValid &&
    customInstructions.trim().length <= 300;

  const loadSavedLetters = useCallback(async () => {
    try {
      setIsLoadingSaved(true);
      setSavedError(null);
      const res = await aiService.listCoverLetters(
        filterByResume ? { resumeId: resume.id } : undefined
      );
      setSavedLetters(res.coverLetters);
    } catch (err: unknown) {
      setSavedError(getAiErrorMessage(err));
    } finally {
      setIsLoadingSaved(false);
    }
  }, [resume.id, filterByResume]);

  useEffect(() => {
    loadSavedLetters();
  }, [loadSavedLetters]);

  const executeGenerate = async () => {
    if (isGenerating) return;
    if (!isFormValid) {
      setGenerateError('Please complete all required fields according to character guidelines.');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerateError(null);

      const generatedDraft = await aiService.generateCoverLetter({
        resumeId: resume.id,
        companyName: companyName.trim(),
        jobRole: jobRole.trim(),
        jobDescription: jobDescription.trim(),
        tone,
        customInstructions: customInstructions.trim() || undefined,
      });

      setDraft(generatedDraft);
      setEditedContent(generatedDraft.content);
      toast.success('Cover letter draft generated!');
    } catch (err: unknown) {
      setGenerateError(getAiErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartGenerate = () => {
    onRequireConsent(() => {
      executeGenerate();
    });
  };

  const handleSaveDraft = async () => {
    if (isSavingDraft || !draft) return;
    if (!editedContent.trim() || editedContent.trim().length < 10) {
      toast.error('Cover letter content must be at least 10 characters long.');
      return;
    }

    try {
      setIsSavingDraft(true);
      const savedRecord = await aiService.saveCoverLetter({
        companyName: draft.companyName,
        jobRole: draft.jobRole,
        jobDescription: draft.jobDescription,
        content: editedContent.trim(),
        resumeId: resume.id,
      });

      toast.success('Cover letter saved successfully!');
      setSavedLetters((prev) => [savedRecord, ...prev.filter((l) => l.id !== savedRecord.id)]);
      setDraft(null);
      setEditedContent('');
      setActiveTab('saved');
    } catch (err: unknown) {
      toast.error(getAiErrorMessage(err));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCopy = (text: string, isDraft = true, letterId?: string) => {
    let success = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      success = true;
    } else if (typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        success = true;
      } catch {
        success = false;
      }
    }
    if (isDraft) {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    } else if (letterId) {
      setCopiedSavedId(letterId);
      setTimeout(() => setCopiedSavedId(null), 2000);
    }
    if (success) {
      toast.success('Copied to clipboard!');
    }
  };

  const handleDiscardClick = () => {
    if (draft && editedContent !== draft.content) {
      setIsDiscardModalOpen(true);
    } else {
      confirmDiscard();
    }
  };

  const confirmDiscard = () => {
    setDraft(null);
    setEditedContent('');
    setIsDiscardModalOpen(false);
  };

  const handleOpenLetter = (letter: CoverLetterRecord) => {
    setSelectedLetter(letter);
    setEditingLetterContent(letter.content);
  };

  const handleUpdateLetter = async () => {
    if (!selectedLetter || isUpdatingLetter) return;
    if (!editingLetterContent.trim() || editingLetterContent.trim().length < 10) {
      toast.error('Cover letter content must be at least 10 characters long.');
      return;
    }

    try {
      setIsUpdatingLetter(true);
      const updated = await aiService.updateCoverLetter(selectedLetter.id, {
        content: editingLetterContent.trim(),
      });

      setSavedLetters((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
      setSelectedLetter(updated);
      toast.success('Cover letter updated successfully!');
    } catch (err: unknown) {
      toast.error(getAiErrorMessage(err));
    } finally {
      setIsUpdatingLetter(false);
    }
  };

  const handleDeleteLetter = async () => {
    if (!letterToDelete || isDeletingLetter) return;

    try {
      setIsDeletingLetter(true);
      await aiService.deleteCoverLetter(letterToDelete.id);
      setSavedLetters((prev) => prev.filter((l) => l.id !== letterToDelete.id));
      if (selectedLetter?.id === letterToDelete.id) {
        setSelectedLetter(null);
      }
      setLetterToDelete(null);
      toast.success('Cover letter deleted.');
    } catch (err: unknown) {
      toast.error(getAiErrorMessage(err));
    } finally {
      setIsDeletingLetter(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <span>AI Cover Letter Generator</span>
          </h2>
          <p className="text-xs text-charcoal-light mt-0.5">
            Craft tailored, professional cover letters grounded in your verified experience and aligned with target role requirements.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-charcoal shadow-2xs'
                : 'text-charcoal-light hover:text-charcoal'
            }`}
          >
            Create Draft
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('saved');
              loadSavedLetters();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-white text-charcoal shadow-2xs'
                : 'text-charcoal-light hover:text-charcoal'
            }`}
          >
            <span>Saved Letters</span>
            <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-primary text-3xs font-bold">
              {savedLetters.length}
            </span>
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/60 flex items-center justify-between text-xs text-charcoal">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary shrink-0" />
          <span>
            Target Resume: <strong>{resume.title}</strong>
            {resume.fullName ? ` (${resume.fullName})` : ''}
          </span>
        </div>
        <span className="text-3xs text-charcoal-light uppercase tracking-wider font-semibold">
          Source Evidence
        </span>
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6">
          {generateError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold block mb-0.5">Generation Notice</span>
                {generateError}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="p-12 text-center bg-orange-50/40 rounded-2xl border border-orange-200/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-primary flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal">
                  Generating Tailored Cover Letter with Google Gemini
                </h3>
                <p className="text-xs text-charcoal-light mt-1 max-w-md mx-auto leading-relaxed">
                  Synthesizing your verified qualifications, aligning impact with job requirements, and ensuring factual preservation...
                </p>
              </div>
            </div>
          )}

          {!isGenerating && !draft && (
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Company Name"
                  placeholder="e.g. Stripe, Google, Linear, Figma"
                  value={companyName}
                  maxLength={100}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                <Input
                  label="Target Job Role / Title"
                  placeholder="e.g. Senior Backend Engineer, Lead DevOps Specialist"
                  value={jobRole}
                  maxLength={100}
                  onChange={(e) => setJobRole(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-charcoal">
                    Target Job Description & Requirements <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-3xs ${
                      descLength > 8000
                        ? 'text-red-600 font-bold'
                        : descLength < 20
                        ? 'text-gray-400'
                        : 'text-emerald-600 font-medium'
                    }`}
                  >
                    {descLength} / 8,000 characters (min 20)
                  </span>
                </div>
                <Textarea
                  rows={6}
                  placeholder="Paste the key responsibilities, role expectations, and technical qualifications from the job posting..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  helperText="The AI contextualizes your experience specifically against these requirements."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-sm font-medium text-charcoal">
                    Letter Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as CoverLetterTone)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="professional">Professional & Balanced</option>
                    <option value="confident">Confident & Direct</option>
                    <option value="enthusiastic">Enthusiastic & Energetic</option>
                    <option value="formal">Traditional & Formal</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Optional Custom Guidance (max 300 chars)"
                    placeholder="e.g. Emphasize distributed systems architecture or relocation flexibility"
                    value={customInstructions}
                    maxLength={300}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    helperText={`${customInstructions.trim().length} / 300 characters`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-3xs text-charcoal-light flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                  <span>Draft generation does not modify your resume or automatically save records.</span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartGenerate}
                  disabled={!isFormValid || isGenerating}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Generate Cover Letter
                </Button>
              </div>
            </div>
          )}

          {!isGenerating && draft && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold mb-0.5 text-amber-950">
                      Unsaved Generated Draft
                    </strong>
                    <span>
                      Review and edit your letter below. This draft is in temporary editor state and will not be stored permanently until you click <strong>Save Cover Letter</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardClick}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    className="bg-white hover:bg-amber-100/50"
                  >
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveDraft}
                    isLoading={isSavingDraft}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Cover Letter
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-3xs text-gray-400 uppercase tracking-wider block font-semibold">
                      Company
                    </span>
                    <span className="font-bold text-charcoal">{draft.companyName}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-gray-400 uppercase tracking-wider block font-semibold">
                      Role
                    </span>
                    <span className="font-bold text-charcoal">{draft.jobRole}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(editedContent, true)}
                    leftIcon={copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedDraft ? 'Copied' : 'Copy Text'}
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    Edit Cover Letter Content
                  </label>
                  <span className="text-3xs text-gray-400">
                    {editedContent.length} characters
                  </span>
                </div>

                <textarea
                  rows={16}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-200 font-serif text-sm leading-relaxed text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                  placeholder="Review and polish your cover letter..."
                />

                <div className="pt-2 flex items-center justify-between text-xs text-charcoal-light">
                  <div className="flex items-center gap-1.5 text-3xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Always verify metrics, job titles, and qualifications before sending to recruiters.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveDraft}
                      isLoading={isSavingDraft}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      Save Cover Letter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200/80">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-charcoal-light font-medium">Filter letters:</span>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-3xs">
                <button
                  type="button"
                  onClick={() => setFilterByResume(true)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    filterByResume
                      ? 'bg-primary text-white shadow-2xs font-semibold'
                      : 'text-charcoal-light hover:text-charcoal'
                  }`}
                >
                  This Resume Only
                </button>
                <button
                  type="button"
                  onClick={() => setFilterByResume(false)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    !filterByResume
                      ? 'bg-primary text-white shadow-2xs font-semibold'
                      : 'text-charcoal-light hover:text-charcoal'
                  }`}
                >
                  All Saved Letters
                </button>
              </div>
            </div>

            <span className="text-3xs text-charcoal-light">
              {savedLetters.length} {savedLetters.length === 1 ? 'letter' : 'letters'} found
            </span>
          </div>

          {savedError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold block mb-0.5">Notice</span>
                {savedError}
              </div>
            </div>
          )}

          {isLoadingSaved && (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-charcoal-light">Loading your saved cover letters...</p>
            </div>
          )}

          {!isLoadingSaved && savedLetters.length === 0 && (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-charcoal">No Saved Cover Letters Yet</h3>
                <p className="text-xs text-charcoal-light max-w-sm mx-auto leading-relaxed">
                  Generate a tailored draft using the &quot;Create Draft&quot; tab above and save it to build your personalized job application archive.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('create')}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Create Your First Cover Letter
              </Button>
            </div>
          )}

          {!isLoadingSaved && savedLetters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-charcoal line-clamp-1">
                          {letter.jobRole}
                        </h4>
                        <span className="text-xs font-semibold text-primary block mt-0.5">
                          {letter.companyName}
                        </span>
                      </div>
                      <span className="text-3xs text-gray-400 shrink-0 font-medium">
                        {new Date(letter.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-light font-serif line-clamp-4 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      {letter.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(letter.content, false, letter.id)}
                        leftIcon={
                          copiedSavedId === letter.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {copiedSavedId === letter.id ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenLetter(letter)}
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        View & Edit
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLetterToDelete(letter)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete cover letter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedLetter && (
        <Modal
          isOpen={Boolean(selectedLetter)}
          onClose={() => setSelectedLetter(null)}
          title={`Cover Letter: ${selectedLetter.jobRole}`}
          description={`Tailored for ${selectedLetter.companyName}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(editingLetterContent, false, selectedLetter.id)}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy Text
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLetter(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUpdateLetter}
                  isLoading={isUpdatingLetter}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <textarea
              rows={14}
              value={editingLetterContent}
              onChange={(e) => setEditingLetterContent(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-200 font-serif text-sm leading-relaxed text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              placeholder="Edit your cover letter..."
            />
            <div className="text-3xs text-charcoal-light flex items-center justify-between">
              <span>Last updated: {new Date(selectedLetter.updatedAt).toLocaleString()}</span>
              <span>{editingLetterContent.length} characters</span>
            </div>
          </div>
        </Modal>
      )}

      {letterToDelete && (
        <Modal
          isOpen={Boolean(letterToDelete)}
          onClose={() => setLetterToDelete(null)}
          title="Delete Cover Letter?"
          description={`Are you sure you want to permanently delete your cover letter for ${letterToDelete.companyName}? This action cannot be undone.`}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLetterToDelete(null)}
                disabled={isDeletingLetter}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteLetter}
                isLoading={isDeletingLetter}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Cover Letter
              </Button>
            </div>
          }
        >
          <div className="p-3 rounded-xl bg-red-50 text-red-900 text-xs leading-relaxed">
            Record ID: <code>{letterToDelete.id}</code> will be removed from your account.
          </div>
        </Modal>
      )}

      {isDiscardModalOpen && (
        <Modal
          isOpen={isDiscardModalOpen}
          onClose={() => setIsDiscardModalOpen(false)}
          title="Discard Unsaved Changes?"
          description="You have made edits to this generated cover letter draft. Discarding will permanently discard these changes and return to the input form."
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDiscardModalOpen(false)}
              >
                Continue Editing
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDiscard}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Discard Changes
              </Button>
            </div>
          }
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs leading-relaxed">
            Your draft modifications will be lost. You can always generate a new draft using your resume details.
          </div>
        </Modal>
      )}
    </div>
  );
};
