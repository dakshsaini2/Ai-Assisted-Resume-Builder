import React from 'react';
import type { Resume } from '../../types';
import { formatDateRange, parseBulletPoints, formatUrlForDisplay } from '../../utils/formatters';

interface CreativeTemplateProps {
  resume: Partial<Resume>;
}

export const CreativeTemplate: React.FC<CreativeTemplateProps> = ({ resume }) => {
  const {
    fullName,
    email,
    phone,
    location,
    linkedin,
    github,
    website,
    summary,
    education = [],
    experiences = [],
    projects = [],
    skills = [],
    certifications = [],
    achievements = [],
    languages = [],
  } = resume;

  // Filter valid entries
  const validEducation = education.filter((e) => e.institution?.trim() || e.degree?.trim());
  const validExperience = experiences.filter((e) => e.company?.trim() || e.position?.trim());
  const validProjects = projects.filter((p) => p.name?.trim());
  const validSkills = skills.filter((s) => s.name?.trim());
  const validCerts = certifications.filter((c) => c.name?.trim());
  const validAchievements = achievements.filter((a) => a.title?.trim());
  const validLanguages = languages.filter((l) => l.name?.trim());

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AM';

  return (
    <div
      className="resume-document bg-white text-gray-800 mx-auto text-left font-sans flex overflow-hidden shadow-xs"
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        fontSize: '9.5pt',
      }}
    >
      {/* Left Sidebar (33% width) */}
      <aside
        className="w-[33%] bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0"
        style={{ padding: '16mm 12mm' }}
      >
        <div className="space-y-6">
          {/* Identity & Monogram */}
          <div className="space-y-2 page-break-avoid">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              {initials}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              {fullName || 'Your Name'}
            </h1>
            <p className="text-[8.5pt] uppercase tracking-wider text-orange-400 font-semibold">
              Executive Resume
            </p>
          </div>

          {/* Contact Details */}
          {(email || phone || location || linkedin || github || website) && (
            <div className="space-y-2.5 border-t border-slate-800 pt-4 page-break-avoid">
              <h3 className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-400">
                Contact
              </h3>
              <div className="space-y-1.5 text-[8.5pt] text-slate-300">
                {email && <p className="break-all">{email}</p>}
                {phone && <p>{phone}</p>}
                {location && <p>{location}</p>}
                {linkedin && (
                  <p className="break-all text-slate-400">
                    {formatUrlForDisplay(linkedin)}
                  </p>
                )}
                {github && (
                  <p className="break-all text-slate-400">
                    {formatUrlForDisplay(github)}
                  </p>
                )}
                {website && (
                  <p className="break-all text-slate-400">
                    {formatUrlForDisplay(website)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {validSkills.length > 0 && (
            <div className="space-y-2.5 border-t border-slate-800 pt-4 page-break-avoid">
              <h3 className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-400">
                Expertise
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {validSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[8pt] border border-slate-700/60"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {validEducation.length > 0 && (
            <div className="space-y-3 border-t border-slate-800 pt-4 page-break-avoid">
              <h3 className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-400">
                Education
              </h3>
              <div className="space-y-3">
                {validEducation.map((edu, idx) => (
                  <div key={idx} className="text-[8.5pt]">
                    <p className="font-semibold text-white leading-tight">{edu.degree}</p>
                    {edu.field && (
                      <p className="text-orange-300 text-[8pt]">in {edu.field}</p>
                    )}
                    <p className="text-slate-400 text-[8pt] mt-0.5">{edu.institution}</p>
                    <p className="text-slate-500 text-[7.5pt]">
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </p>
                    {edu.gpa && (
                      <p className="text-slate-400 text-[7.5pt]">GPA: {edu.gpa}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {validLanguages.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-4 page-break-avoid">
              <h3 className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-400">
                Languages
              </h3>
              <div className="space-y-1 text-[8.5pt]">
                {validLanguages.map((l, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span>{l.name}</span>
                    <span className="text-slate-500 text-[8pt]">{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right Content Area (67% width) */}
      <main
        className="w-[67%] bg-white flex flex-col justify-between"
        style={{ padding: '16mm 16mm' }}
      >
        <div className="space-y-5">
          {/* Executive Summary */}
          {summary && summary.trim() && (
            <section className="page-break-avoid">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-2">
                Executive Profile
              </h2>
              <p className="text-[9pt] text-gray-700 leading-relaxed text-justify">
                {summary.trim()}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {validExperience.length > 0 && (
            <section>
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-3">
                Experience & Leadership
              </h2>
              <div className="space-y-3.5">
                {validExperience.map((exp, idx) => {
                  const bullets = parseBulletPoints(exp.description);
                  const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current);

                  return (
                    <article key={idx} className="page-break-avoid">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-gray-900 text-[9.5pt]">
                            {exp.position}
                          </span>
                          {exp.company && (
                            <span className="text-orange-600 font-semibold text-[9pt]">
                              {' '}
                              • {exp.company}
                            </span>
                          )}
                        </div>
                        {dateStr && (
                          <span className="text-[8.5pt] text-gray-400 shrink-0 ml-2">
                            {dateStr}
                          </span>
                        )}
                      </div>
                      {exp.location && (
                        <p className="text-[8pt] text-gray-400 italic mb-1">{exp.location}</p>
                      )}
                      {bullets.length > 0 ? (
                        <ul className="list-disc list-outside ml-4 text-[9pt] text-gray-700 space-y-1 mt-1">
                          {bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">
                              {b}
                            </li>
                          ))}
                        </ul>
                      ) : exp.description ? (
                        <p className="text-[9pt] text-gray-700 mt-1 whitespace-pre-line leading-snug">
                          {exp.description}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Featured Projects */}
          {validProjects.length > 0 && (
            <section>
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-3">
                Featured Projects
              </h2>
              <div className="space-y-3">
                {validProjects.map((proj, idx) => {
                  const bullets = parseBulletPoints(proj.description);
                  const dateStr = formatDateRange(proj.startDate, proj.endDate);

                  return (
                    <article key={idx} className="page-break-avoid text-[9pt]">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-gray-900">{proj.name}</span>
                          {proj.technologies && (
                            <span className="text-[8pt] text-gray-500 font-normal ml-2">
                              ({proj.technologies})
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-2 text-[8pt]">
                          {dateStr && <span className="text-gray-400 mr-2">{dateStr}</span>}
                          {proj.link && (
                            <span className="text-orange-600 font-medium">
                              {formatUrlForDisplay(proj.link)}
                            </span>
                          )}
                        </div>
                      </div>
                      {bullets.length > 0 ? (
                        <ul className="list-disc list-outside ml-4 text-[8.5pt] text-gray-700 space-y-0.5 mt-1">
                          {bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">
                              {b}
                            </li>
                          ))}
                        </ul>
                      ) : proj.description ? (
                        <p className="text-[8.5pt] text-gray-700 mt-0.5 leading-snug">
                          {proj.description}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Honors & Certifications */}
          {(validCerts.length > 0 || validAchievements.length > 0) && (
            <section className="page-break-avoid">
              <h2 className="text-[10pt] font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-2">
                Honors & Certifications
              </h2>
              <ul className="text-[8.5pt] text-gray-700 space-y-1">
                {validCerts.map((c, idx) => (
                  <li key={`c-${idx}`}>
                    <strong className="text-gray-900">{c.name}</strong>
                    {c.issuer ? ` — ${c.issuer}` : ''} {c.date ? `(${c.date})` : ''}
                  </li>
                ))}
                {validAchievements.map((a, idx) => (
                  <li key={`a-${idx}`}>
                    <strong className="text-gray-900">{a.title}</strong>
                    {a.description ? `: ${a.description}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

