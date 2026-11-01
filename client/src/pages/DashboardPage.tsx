import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Clock,
  Trash2,
  Edit3,
  Sparkles,
  Layers,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/common/Button';
import { Card, CardBody } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { useAuthStore } from '../store/authStore';
import { resumeService, downloadResumePdf } from '../services/resumeService';
import type { ResumeListItem } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState<'classic' | 'modern' | 'creative'>('modern');
  const [isCreating, setIsCreating] = useState(false);

  // Delete Modal State
  const [resumeToDelete, setResumeToDelete] = useState<ResumeListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // PDF Download State (tracks which resume ID is generating PDF)
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (resumeId: string, resumeTitle?: string) => {
    if (downloadingId === resumeId) return;

    try {
      setDownloadingId(resumeId);
      toast.loading(`Generating PDF for ${resumeTitle || 'resume'}...`, {
        id: `dash-pdf-${resumeId}`,
      });
      const filename = await downloadResumePdf(resumeId);
      toast.success(`Downloaded ${filename}`, { id: `dash-pdf-${resumeId}` });
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF. Please try again.', {
        id: `dash-pdf-${resumeId}`,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchResumes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await resumeService.getAll();
      setResumes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load your resumes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Please enter a title for your resume');
      return;
    }

    try {
      setIsCreating(true);
      const created = await resumeService.create({
        title: newTitle.trim(),
        templateId: newTemplate,
        fullName: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
        email: user?.email,
      });

      toast.success('Resume created successfully!');
      setIsCreateModalOpen(false);
      setNewTitle('');
      navigate(`/editor/${created.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create resume');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return;

    try {
      setIsDeleting(true);
      await resumeService.delete(resumeToDelete.id);
      toast.success('Resume deleted successfully.');
      setResumes((prev) => prev.filter((r) => r.id !== resumeToDelete.id));
      setResumeToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete resume.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getTemplateBadge = (templateId: string) => {
    switch (templateId) {
      case 'modern':
        return (
          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-primary text-xs font-semibold">
            Modern
          </span>
        );
      case 'creative':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold">
            Creative
          </span>
        );
      case 'classic':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
            Classic ATS
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
              Welcome back, {user?.firstName || 'there'}!
            </h1>
            <p className="mt-1 text-sm text-charcoal-light">
              Manage your resumes, optimize with AI, and track your application materials.
            </p>
          </div>

          <Button
            onClick={() => {
              setNewTitle('Software Engineer Resume');
              setIsCreateModalOpen(true);
            }}
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm shrink-0"
          >
            Create New Resume
          </Button>
        </div>

        {/* Quick Stats / AI Feature Announcement Bar */}
        <div className="my-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-warm-white to-amber-50 border border-orange-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal">
                AI Assistant is ready to refine your content
              </h3>
              <p className="text-xs text-charcoal-light mt-0.5">
                Generate high-impact bullet points and calculate ATS keyword match scores inside the editor.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary px-3 py-1 bg-white rounded-full border border-orange-200 shadow-2xs">
            Google Gemini Powered
          </span>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <LoadingState message="Loading your resumes..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchResumes} />
        ) : resumes.length === 0 ? (
          <EmptyState
            title="No resumes yet"
            description="Create your first professional resume in seconds using our ATS-friendly templates and AI tools."
            actionLabel="Create My First Resume"
            onAction={() => {
              setNewTitle('My Resume');
              setIsCreateModalOpen(true);
            }}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-charcoal">
                Your Saved Resumes ({resumes.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <Card
                  key={resume.id}
                  hoverable
                  className="flex flex-col justify-between overflow-hidden"
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-primary flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-charcoal line-clamp-1">
                          {resume.title}
                        </h3>
                      </div>
                      {getTemplateBadge(resume.templateId)}
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      {resume.fullName ? resume.fullName : 'No contact name specified'}
                    </p>

                    {/* Section Count Tags */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 mb-6">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100">
                        <GraduationCap className="w-3 h-3 text-gray-400" />
                        <span>{resume._count.education} Edu</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        <span>{resume._count.experiences} Exp</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100">
                        <Layers className="w-3 h-3 text-gray-400" />
                        <span>{resume._count.projects} Proj</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100">
                        <span>{resume._count.skills} Skills</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Updated {formatDate(resume.updatedAt)}</span>
                      </div>
                    </div>
                  </CardBody>

                  <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeToDelete(resume)}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      aria-label={`Delete ${resume.title}`}
                    >
                      Delete
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(resume.id, resume.title)}
                        isLoading={downloadingId === resume.id}
                        disabled={downloadingId === resume.id}
                        leftIcon={<Download className="w-3.5 h-3.5 text-primary" />}
                        title="Download PDF"
                        aria-label={`Download PDF for ${resume.title}`}
                      >
                        {downloadingId === resume.id ? 'Generating...' : 'PDF'}
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/editor/${resume.id}`)}
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        aria-label={`Edit ${resume.title}`}
                      >
                        Edit Resume
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* CREATE RESUME MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Resume"
        description="Choose a title and starting template. You can switch templates anytime later."
      >
        <form onSubmit={handleCreateResume} className="space-y-5">
          <Input
            label="Resume Title"
            placeholder="e.g. Senior Frontend Engineer"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Select Starting Template
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'classic', label: 'Classic ATS', desc: 'Clean, single column' },
                { id: 'modern', label: 'Modern', desc: 'Sleek accents' },
                { id: 'creative', label: 'Creative', desc: 'Dual-column layout' },
              ].map((tmpl) => (
                <button
                  type="button"
                  key={tmpl.id}
                  onClick={() => setNewTemplate(tmpl.id as any)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    newTemplate === tmpl.id
                      ? 'border-primary bg-orange-50/70 ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-charcoal">{tmpl.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{tmpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create Resume
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!resumeToDelete}
        onClose={() => setResumeToDelete(null)}
        title="Delete Resume"
        description="Are you sure you want to delete this resume? This action cannot be undone."
      >
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3 my-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Deleting <strong>{resumeToDelete?.title}</strong> will permanently remove all associated sections and AI analysis.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setResumeToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isDeleting}
            onClick={handleDeleteResume}
          >
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
};

