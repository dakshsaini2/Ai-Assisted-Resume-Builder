import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShieldCheck, Sparkles, CheckCircle2, Lock, AlertCircle } from 'lucide-react';

interface AiConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AiConsentModal: React.FC<AiConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Features & Privacy Notice"
      description="Please review how your resume data is processed before using Google Gemini AI features."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            I Understand & Continue
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-charcoal">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-50 border border-orange-200/70 text-orange-950">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-charcoal block mb-0.5">
              Secure, Controlled AI Processing
            </span>
            Our AI tools assist you in writing compelling professional summaries and polishing bullet points while maintaining your full privacy and editorial control.
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-charcoal-light leading-relaxed">
              <strong className="text-charcoal">Real-time Data Transmission:</strong> When you generate or polish content, only the relevant resume text (e.g. experience, education, skills) is transmitted securely to the Google Gemini API.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-charcoal-light leading-relaxed">
              <strong className="text-charcoal">Strict In-Memory Drafts:</strong> AI suggestions are loaded directly into your editor for review. They are <em>never</em> automatically saved to your database until you click "Save Changes".
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-charcoal-light leading-relaxed">
              <strong className="text-charcoal">Factuality & Review:</strong> AI generates draft phrasing based strictly on your source details. You maintain full responsibility to review and ensure all qualifications and metrics are accurate.
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 text-xs text-charcoal-light">
          Your consent will be remembered in this browser. You can cancel at any time.
        </div>
      </div>
    </Modal>
  );
};
