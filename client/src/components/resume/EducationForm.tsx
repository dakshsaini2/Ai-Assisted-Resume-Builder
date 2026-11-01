import React from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import type { Education } from '../../types';

interface EducationFormProps {
  items: Education[];
  onChange: (items: Education[]) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({ items, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...items,
      {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
        description: '',
        sortOrder: items.length,
      },
    ]);
  };

  const handleUpdate = (index: number, fields: Partial<Education>) => {
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
          <h3 className="text-base font-bold text-charcoal">Education</h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            Add your degrees, colleges, relevant coursework, and academic honors.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Degree
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <GraduationCap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-charcoal">No education entries yet</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Click the button below to add your university or degree.
          </p>
          <Button size="sm" variant="primary" onClick={handleAdd}>
            Add Education
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Degree #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                  aria-label="Delete degree"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Institution / University"
                  placeholder="e.g. Stanford University"
                  value={item.institution}
                  onChange={(e) => handleUpdate(index, { institution: e.target.value })}
                  required
                />
                <Input
                  label="Degree"
                  placeholder="e.g. Bachelor of Science"
                  value={item.degree}
                  onChange={(e) => handleUpdate(index, { degree: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Field of Study / Major"
                  placeholder="e.g. Computer Science"
                  value={item.field || ''}
                  onChange={(e) => handleUpdate(index, { field: e.target.value })}
                />
                <Input
                  label="Start Date"
                  placeholder="e.g. Sep 2020"
                  value={item.startDate || ''}
                  onChange={(e) => handleUpdate(index, { startDate: e.target.value })}
                />
                <Input
                  label="End Date / Expected"
                  placeholder="e.g. May 2024"
                  value={item.endDate || ''}
                  onChange={(e) => handleUpdate(index, { endDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="GPA / Honors (Optional)"
                  placeholder="e.g. 3.8 / 4.0"
                  value={item.gpa || ''}
                  onChange={(e) => handleUpdate(index, { gpa: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <Textarea
                    label="Description / Relevant Coursework"
                    placeholder="e.g. Data Structures, Algorithms, Distributed Systems, Dean's Honor Roll..."
                    rows={2}
                    value={item.description || ''}
                    onChange={(e) => handleUpdate(index, { description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
