import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg text-charcoal">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>ResumAI</span>
            </Link>
            <p className="mt-3 text-sm text-charcoal-light max-w-sm">
              Empowering students and job seekers with modern resume templates, intelligent AI bullet-point improvements, and ATS optimization.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Semester 7 CSE Mini-Project
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-sm text-charcoal-light">
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/templates" className="hover:text-primary transition-colors">
                  Resume Templates
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal mb-3">
              Tech Stack
            </h4>
            <ul className="space-y-2 text-sm text-charcoal-light">
              <li>React 19 & Vite</li>
              <li>Express & TypeScript</li>
              <li>PostgreSQL & Prisma</li>
              <li>Google Gemini API</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} AI-Assisted Resume Builder. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern full-stack web standards
          </p>
        </div>
      </div>
    </footer>
  );
};
