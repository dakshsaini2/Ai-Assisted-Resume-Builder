import React from 'react';
import {
  User,
  FileText,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Cpu,
  Award,
  Trophy,
  Languages,
  Sparkles,
  Search,
  Mail,
} from 'lucide-react';

export interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  category?: 'sections' | 'ai';
}

export interface SidebarProps {
  activeSection: string;
  onSelectSection: (id: string) => void;
  className?: string;
}

export const resumeSections: SidebarSection[] = [
  { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" />, category: 'sections' },
  { id: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" />, category: 'sections' },
  { id: 'education', label: 'Education', icon: <GraduationCap className="w-4 h-4" />, category: 'sections' },
  { id: 'experience', label: 'Experience', icon: <Briefcase className="w-4 h-4" />, category: 'sections' },
  { id: 'projects', label: 'Projects', icon: <FolderGit2 className="w-4 h-4" />, category: 'sections' },
  { id: 'skills', label: 'Skills', icon: <Cpu className="w-4 h-4" />, category: 'sections' },
  { id: 'certifications', label: 'Certifications', icon: <Award className="w-4 h-4" />, category: 'sections' },
  { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" />, category: 'sections' },
  { id: 'languages', label: 'Languages', icon: <Languages className="w-4 h-4" />, category: 'sections' },

  // AI Tools
  { id: 'ai-analyzer', label: 'ATS Analysis', icon: <Sparkles className="w-4 h-4" />, category: 'ai' },
  { id: 'ai-cover-letter', label: 'Cover Letter', icon: <Mail className="w-4 h-4" />, category: 'ai' },
  { id: 'ai-job-match', label: 'Job Matching', icon: <Search className="w-4 h-4" />, category: 'ai' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  className = '',
}) => {
  const standardSections = resumeSections.filter((s) => s.category === 'sections');
  const aiSections = resumeSections.filter((s) => s.category === 'ai');

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200/80 p-4 flex flex-col gap-6 shrink-0 ${className}`}
    >
      <div>
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Resume Content
        </h3>
        <nav className="space-y-1">
          {standardSections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-orange-50 text-primary border border-orange-200/60 font-semibold'
                    : 'text-charcoal-light hover:bg-gray-50 hover:text-charcoal'
                }`}
              >
                <span className={isActive ? 'text-primary' : 'text-gray-400'}>
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>AI Enhancements</span>
        </h3>
        <nav className="space-y-1">
          {aiSections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-orange-50 text-primary border border-orange-200/60 font-semibold'
                    : 'text-charcoal-light hover:bg-gray-50 hover:text-charcoal'
                }`}
              >
                <span className={isActive ? 'text-primary' : 'text-gray-400'}>
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
