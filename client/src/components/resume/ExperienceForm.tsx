import React from 'react';
import { Plus, Trash2, Briefcase, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import type { Experience } from '../../types';

interface ExperienceFormProps {
  items: Experience[];
  onChange: (items: Experience[]) => void;
  onImproveBullet?: (text: string, onAccept: (improved: string) => void) => void;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({
  items,
  onChange,
  onImproveBullet,
}) => {
  const handleAdd = () => {
    onChange([
      ...items,
      {
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        sortOrder: items.length,
      },
    ]);
  };

  const handleUpdate = (index: number, fields: Partial<Experience>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...fields };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-charcoal">Work Experience</h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            List your employment, internships, and relevant roles in reverse-chronological order.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Position
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-charcoal">No work experience added yet</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Add full-time jobs, internships, freelance, or research roles.
          </p>
          <Button size="sm" variant="primary" onClick={handleAdd}>
            Add Experience
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Role #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                  aria-label="Delete position"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Position / Job Title"
                  placeholder="e.g. Software Engineer"
                  value={item.position}
                  onChange={(e) => handleUpdate(index, { position: e.target.value })}
                  required
                />
                <Input
                  label="Company Name"
                  placeholder="e.g. Google or Startup Inc"
                  value={item.company}
                  onChange={(e) => handleUpdate(index, { company: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Location (City, Country or Remote)"
                  placeholder="e.g. New York, NY (Remote)"
                  value={item.location || ''}
                  onChange={(e) => handleUpdate(index, { location: e.target.value })}
                />
                <Input
                  label="Start Date"
                  placeholder="e.g. Jun 2022"
                  value={item.startDate || ''}
                  onChange={(e) => handleUpdate(index, { startDate: e.target.value })}
                />
                <div>
                  <Input
                    label="End Date"
                    placeholder="e.g. Present"
                    value={item.current ? 'Present' : item.endDate || ''}
                    disabled={item.current}
                    onChange={(e) => handleUpdate(index, { endDate: e.target.value })}
                  />
                  <label className="flex items-center gap-2 mt-2 text-xs text-charcoal-light cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.current || false}
                      onChange={(e) =>
                        handleUpdate(index, {
                          current: e.target.checked,
                          endDate: e.target.checked ? 'Present' : '',
                        })
                      }
                      className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span>I currently work here</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-charcoal">
                    Description & Bullet Points
                  </label>
                  {onImproveBullet && item.description && (
                    <button
                      type="button"
                      onClick={() =>
                        onImproveBullet(item.description || '', (improved) =>
                          handleUpdate(index, { description: improved })
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Improve with AI</span>
                    </button>
                  )}
                </div>
                <Textarea
                  rows={4}
                  placeholder="• Developed responsive React web applications serving 10,000+ monthly users.&#10;• Reduced database query response times by 35% through query optimization and caching.&#10;• Collaborated in an Agile squad of 6 engineers."
                  value={item.description || ''}
                  onChange={(e) => handleUpdate(index, { description: e.target.value })}
                  helperText="Use bullet points (•) starting with strong action verbs (Architected, Engineered, Optimized)."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
