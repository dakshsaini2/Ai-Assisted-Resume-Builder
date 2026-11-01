import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Sparkles, RefreshCw, AlertTriangle, Check, ArrowLeft, Wand2 } from 'lucide-react';
import { aiService, getAiErrorMessage } from '../../services/aiService';
import type { SummaryTone } from '../../types';

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string;
  currentSummary?: string | null;
  onApply: (summary: string) => void;
}

const TONE_OPTIONS: { value: SummaryTone; label: string; description: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Balanced, authoritative, and suitable for all corporate roles',
  },
  {
    value: 'executive',
    label: 'Executive',
    description: 'Leadership-focused, strategic vision, and high-level business impact',
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Emphasizes technical stack, engineering depth, and architecture',
  },
  {
    value: 'creative',
    label: 'Creative',
    description: 'Dynamic, innovative, and focused on storytelling and design thinking',
  },
];

export const AiSummaryModal: React.FC<AiSummaryModalProps> = ({
  isOpen,
  onClose,
  resumeId,
  currentSummary,
  onApply,
}) => {
  const [targetRole, setTargetRole] = useState('');
  const [tone, setTone] = useState<SummaryTone>('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [editableSummary, setEditableSummary] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!resumeId) {
      setError('Resume ID is missing. Please save your resume first.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await aiService.generateProfessionalSummary(resumeId, {
        targetRole: targetRole.trim() || undefined,
        tone,
        customInstructions: customInstructions.trim() || undefined,
      });

      setGeneratedSummary(result.summary);
      setEditableSummary(result.summary);
    } catch (err: unknown) {
      setError(getAiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAndApply = () => {
    if (!editableSummary.trim()) {
      setError('Summary cannot be empty.');
      return;
    }
    onApply(editableSummary.trim());
    onClose();
  };

  const handleBackToPrompt = () => {
    setGeneratedSummary(null);
    setError(null);
  };

  const wordCount = editableSummary.trim()
    ? editableSummary.trim().split(/\s+/).length
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Professional Summary"
      description={
        generatedSummary
          ? 'Review and refine the AI-generated draft before applying it to your resume.'
          : 'Tailor a high-impact summary synthesizing your experience, skills, and background.'
      }
      size="lg"
      footer={
        generatedSummary ? (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToPrompt}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Adjust Prompt
            </Button>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                isLoading={isLoading}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Regenerate
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptAndApply}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Accept & Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              isLoading={isLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Summary
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block mb-0.5">Generation Notice</span>
              {error}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="p-8 text-center bg-orange-50/40 rounded-xl border border-orange-200/60 space-y-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-primary flex items-center justify-center mx-auto animate-pulse">
              <Wand2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">
                Synthesizing Professional Summary
              </p>
              <p className="text-xs text-charcoal-light mt-1">
                Analyzing your experience, education, and skills with Google Gemini...
              </p>
            </div>
          </div>
        )}

        {!isLoading && generatedSummary && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-charcoal-light">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gray-100 font-medium capitalize text-charcoal">
                  Tone: {tone}
                </span>
                {targetRole && (
                  <span className="px-2 py-0.5 rounded bg-orange-50 text-primary font-medium">
                    Target: {targetRole}
                  </span>
                )}
              </div>
              <span className="font-medium text-gray-500">
                {wordCount} words • {editableSummary.length} characters
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider">
                Editable Summary Draft
              </label>
              <Textarea
                rows={6}
                value={editableSummary}
                onChange={(e) => setEditableSummary(e.target.value)}
                placeholder="AI-generated summary will appear here..."
                helperText="You can edit this draft directly before accepting. Clicking 'Accept & Apply' applies it to the editor without auto-saving to the database."
              />
            </div>

            {currentSummary && (
              <details className="text-xs text-charcoal-light bg-gray-50 rounded-lg p-3 border border-gray-200/70">
                <summary className="font-medium text-charcoal cursor-pointer select-none">
                  Compare with existing summary
                </summary>
                <p className="mt-2 text-gray-600 italic bg-white p-2.5 rounded border border-gray-100 whitespace-pre-wrap">
                  {currentSummary}
                </p>
              </details>
            )}
          </div>
        )}

        {!isLoading && !generatedSummary && (
          <div className="space-y-4">
            <Input
              label="Target Role or Job Title (Optional)"
              placeholder="e.g. Senior Full-Stack Engineer, Lead Product Designer"
              value={targetRole}
              maxLength={100}
              onChange={(e) => setTargetRole(e.target.value)}
              helperText="Specifying a role tailors keywords and seniority emphasis to match your target position."
            />

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Tone & Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTone(opt.value)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      tone === opt.value
                        ? 'border-primary bg-orange-50/50 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-charcoal">
                        {opt.label}
                      </span>
                      {tone === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-charcoal-light mt-0.5 line-clamp-2">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Custom Instructions (Optional)"
              placeholder="e.g. Emphasize cloud architecture, cross-functional leadership, and high-scale systems..."
              value={customInstructions}
              maxLength={300}
              rows={3}
              onChange={(e) => setCustomInstructions(e.target.value)}
              helperText="Provide specific focus areas or themes (max 300 characters). Factual details are derived strictly from your resume."
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
