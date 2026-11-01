import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Zap,
  Target,
  FileText,
  Layers,
  ChevronRight,
  Shield,
  Cpu,
  Award,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/authStore';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-warm-white text-charcoal">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-200/30 blur-3xl pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/70 text-primary-dark text-xs font-semibold mb-6 border border-orange-200/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI-Powered Resume Builder for Tech & Modern Careers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-charcoal leading-[1.15]">
                Craft job-winning resumes in minutes with{' '}
                <span className="text-primary underline decoration-orange-300 decoration-wavy decoration-2">
                  intelligent AI
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-charcoal-light leading-relaxed max-w-2xl mx-auto">
                Transform rough bullet points into professional, metric-driven achievements.
                Choose between three battle-tested ATS templates and export pixel-perfect PDFs instantly.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                  <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    {isAuthenticated ? 'Go to Dashboard' : 'Build Your Free Resume'}
                  </Button>
                </Link>
                <a href="#templates">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Templates
                  </Button>
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-charcoal-light font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ATS-Friendly Formatting</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Google Gemini Integration</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Free for Students</span>
                </div>
              </div>
            </div>

            <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-gray-200/80 bg-white p-3 shadow-xl">
              <div className="rounded-xl bg-warm-white border border-gray-100 overflow-hidden p-6 sm:p-10 text-left">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-charcoal">Alex Morgan</h3>
                    <p className="text-xs text-primary font-semibold tracking-wide">FULL STACK SOFTWARE ENGINEER</p>
                  </div>
                  <div className="text-right text-xs text-gray-400 space-y-0.5">
                    <p>alex.morgan@example.com</p>
                    <p>github.com/alexmorgan • linkedin.com/in/alexmorgan</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-charcoal-light">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px] border-b border-gray-100 pb-1 mb-2">
                        Professional Experience
                      </h4>
                      <div className="mb-2">
                        <div className="flex justify-between font-semibold text-charcoal">
                          <span>Software Engineer • Acme Cloud Systems</span>
                          <span className="text-gray-400">2023 – Present</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-gray-600">
                          <li>Engineered scalable REST microservices handling 12,000+ daily active requests with 99.98% uptime.</li>
                          <li>Integrated Gemini AI suggestions reducing resume review latency by 45%.</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px] border-b border-gray-100 pb-1 mb-2">
                        Featured Projects
                      </h4>
                      <div>
                        <span className="font-semibold text-charcoal">AI Resume Builder & ATS Scanner</span>
                        <p className="text-gray-600 mt-0.5">
                          Architected full-stack React and Express platform featuring automated keyword scoring and PDF export.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-l border-gray-100 md:pl-4">
                    <div>
                      <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px] border-b border-gray-100 pb-1 mb-2">
                        Core Competencies
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'Tailwind CSS'].map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-gray-100 text-charcoal font-medium text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px] border-b border-gray-100 pb-1 mb-2">
                        Education
                      </h4>
                      <p className="font-semibold text-charcoal">B.S. in Computer Science</p>
                      <p className="text-gray-500">State University • GPA: 3.8/4.0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-white border-y border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Powerful Capabilities
              </h2>
              <h3 className="text-3xl font-extrabold text-charcoal tracking-tight sm:text-4xl">
                Everything you need to land your next interview
              </h3>
              <p className="mt-4 text-base text-charcoal-light">
                Designed for students, fresh graduates, and experienced engineers aiming for high-impact roles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 hover:border-orange-300 transition-all shadow-xs hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-primary flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  AI Content Improvement
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Turn weak descriptions like &quot;wrote code for app&quot; into action-oriented achievements with quantifiable impact powered by Gemini.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 hover:border-orange-300 transition-all shadow-xs hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  3 Professional Templates
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Switch instantly between Classic (ATS standard), Modern (contemporary accent), and Creative (distinctive layout) without losing your data.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 hover:border-orange-300 transition-all shadow-xs hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  ATS Resume Analyzer
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Receive an automated resume quality score, completeness audit, and clear actionable keyword suggestions to pass screening filters.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 hover:border-orange-300 transition-all shadow-xs hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  Job Description Matching
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Paste the target job description to compute a compatibility match score, highlight missing skills, and optimize keywords.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 hover:border-orange-300 transition-all shadow-xs hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  Tailored Cover Letters
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Generate customized cover letters that align your specific project experience directly to the company&apos;s job requirements.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 hover:border-orange-300 transition-all shadow-xs hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  Pixel-Perfect PDF Export
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Clean A4 document layout with true typographical hierarchy, proper page margins, and zero formatting distortion.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="templates" className="py-20 bg-warm-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Designed for Success
              </h2>
              <h3 className="text-3xl font-extrabold text-charcoal tracking-tight sm:text-4xl">
                Three Distinct Layouts for Every Career Stage
              </h3>
              <p className="mt-4 text-base text-charcoal-light">
                Switch templates anytime with one click. Your data is always preserved.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all">
                <div>
                  <div className="h-64 rounded-xl bg-gray-50 border border-gray-200 p-4 mb-5 flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="border-b border-gray-300 pb-2 text-center">
                      <div className="h-3 w-28 bg-charcoal rounded mx-auto mb-1" />
                      <div className="h-2 w-44 bg-gray-300 rounded mx-auto" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="h-2 w-16 bg-charcoal rounded mb-1" />
                        <div className="h-1.5 w-full bg-gray-200 rounded mb-0.5" />
                        <div className="h-1.5 w-4/5 bg-gray-200 rounded" />
                      </div>
                      <div>
                        <div className="h-2 w-20 bg-charcoal rounded mb-1" />
                        <div className="h-1.5 w-full bg-gray-200 rounded mb-0.5" />
                        <div className="h-1.5 w-3/4 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1 justify-center">
                      <span className="h-3 w-10 bg-gray-200 rounded" />
                      <span className="h-3 w-10 bg-gray-200 rounded" />
                      <span className="h-3 w-10 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-charcoal">Classic ATS</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      Max ATS Pass Rate
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-light mb-4">
                    Clean single-column structure designed strictly for maximum machine parsing compatibility in corporate ATS screening.
                  </p>
                </div>
                <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                  <Button variant="outline" className="w-full">
                    Use Classic
                  </Button>
                </Link>
              </div>

              <div className="bg-white rounded-2xl border-2 border-primary/40 p-6 flex flex-col justify-between hover:shadow-lg transition-all relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-xs font-semibold shadow-xs">
                  Most Popular
                </span>
                <div>
                  <div className="h-64 rounded-xl bg-gray-50 border border-gray-200 p-4 mb-5 flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="bg-primary/10 border-l-4 border-primary p-2.5 rounded-r">
                      <div className="h-3 w-32 bg-charcoal rounded mb-1" />
                      <div className="h-2 w-24 bg-primary/70 rounded" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="h-2 w-20 bg-primary rounded mb-1" />
                        <div className="h-1.5 w-full bg-gray-200 rounded mb-0.5" />
                        <div className="h-1.5 w-5/6 bg-gray-200 rounded" />
                      </div>
                      <div>
                        <div className="h-2 w-16 bg-primary rounded mb-1" />
                        <div className="h-1.5 w-full bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="h-3 w-12 bg-orange-100 rounded" />
                      <span className="h-3 w-12 bg-orange-100 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-charcoal">Modern Tech</h4>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-primary text-[11px] font-semibold">
                      Tech & Startups
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-light mb-4">
                    Contemporary design with subtle color accents and crisp typography that stands out in recruiter inboxes.
                  </p>
                </div>
                <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                  <Button variant="primary" className="w-full">
                    Use Modern
                  </Button>
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all">
                <div>
                  <div className="h-64 rounded-xl bg-gray-50 border border-gray-200 mb-5 flex overflow-hidden shadow-inner">
                    <div className="w-1/3 bg-charcoal p-3 flex flex-col justify-between text-white">
                      <div className="w-8 h-8 rounded-full bg-gray-600 mb-2" />
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-gray-500 rounded" />
                        <div className="h-1.5 w-3/4 bg-gray-500 rounded" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-gray-500 rounded" />
                        <div className="h-1.5 w-2/3 bg-gray-500 rounded" />
                      </div>
                    </div>
                    <div className="w-2/3 p-3 flex flex-col justify-between">
                      <div className="h-3 w-28 bg-charcoal rounded mb-1" />
                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-gray-200 rounded" />
                        <div className="h-1.5 w-4/5 bg-gray-200 rounded" />
                        <div className="h-1.5 w-full bg-gray-200 rounded" />
                      </div>
                      <div className="h-2 w-16 bg-charcoal rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-charcoal">Creative Executive</h4>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold">
                      Design & Product
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-light mb-4">
                    Two-column sidebar structure balancing skills and metrics for product managers, design leads, and innovators.
                  </p>
                </div>
                <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                  <Button variant="outline" className="w-full">
                    Use Creative
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-white border-t border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Simple 3-Step Process
              </h2>
              <h3 className="text-3xl font-extrabold text-charcoal tracking-tight sm:text-4xl">
                How It Works
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 text-center relative">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-4 text-base">
                  1
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">Add Your Experience</h4>
                <p className="text-sm text-charcoal-light">
                  Input your education, projects, skills, and work history in our intuitive multi-section form.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 text-center relative">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-4 text-base">
                  2
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">Refine with AI</h4>
                <p className="text-sm text-charcoal-light">
                  Use one-click AI improvement to boost bullet points, generate concise summaries, and check ATS keyword density.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-warm-white border border-gray-200/70 text-center relative">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-4 text-base">
                  3
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">Export Clean PDF</h4>
                <p className="text-sm text-charcoal-light">
                  Select your desired template, preview the live A4 document, and download your high-resolution resume PDF.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20 bg-warm-white border-t border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Our Mission & Standards
              </h2>
              <h3 className="text-3xl font-extrabold text-charcoal tracking-tight sm:text-4xl">
                Built for High-Impact Careers
              </h3>
              <p className="mt-4 text-base text-charcoal-light">
                ResumAI provides candidates with intelligent writing tools, battle-tested ATS compliance, and privacy-first document generation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-primary flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  Privacy & Data Ownership
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Your career data is completely private. We never share, sell, or train public models on your personal resume details.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  Precision Engineering
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  Every template is crafted to match modern recruiter reading habits and automated ATS parser standards without layout breakage.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-charcoal mb-2">
                  Authentic AI Enhancement
                </h4>
                <p className="text-sm text-charcoal-light leading-relaxed">
                  AI suggestions elevate your achievements into measurable business impact while preserving your genuine accomplishments and tone.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-charcoal text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to take your career to the next level?
            </h3>
            <p className="mt-4 text-base text-gray-300 max-w-xl mx-auto">
              Create your account now and start building high-impact resumes tailored to your dream roles.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button size="lg" className="shadow-lg" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
