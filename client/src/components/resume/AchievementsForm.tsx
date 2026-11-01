import React from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import type { Achievement } from '../../types';

interface AchievementsFormProps {
  items: Achievement[];
  onChange: (items: Achievement[]) => void;
}

export const AchievementsForm: React.FC<AchievementsFormProps> = ({ items, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...items,
      {
        title: '',
        description: '',
        date: '',
        sortOrder: items.length,
      },
    ]);
  };

  const handleUpdate = (index: number, fields: Partial<Achievement>) => {
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
          <h3 className="text-base font-bold text-charcoal">Key Achievements & Honors</h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            Add hackathon wins, competitive programming ranks, scholarships, or publications.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Achievement
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-charcoal">No achievements added yet</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Showcase awards, coding competitions, or leadership recognitions.
          </p>
          <Button size="sm" variant="primary" onClick={handleAdd}>
            Add Achievement
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
                  Achievement #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Achievement Title / Award"
                    placeholder="e.g. 1st Place — National Hackathon 2024"
                    value={item.title}
                    onChange={(e) => handleUpdate(index, { title: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Date / Year"
                  placeholder="e.g. Nov 2024"
                  value={item.date || ''}
                  onChange={(e) => handleUpdate(index, { date: e.target.value })}
                />
              </div>

              <Textarea
                label="Details & Impact"
                placeholder="e.g. Built an accessibility AI prototype among 150+ teams; received \$10,000 cash grant and mentorship."
                rows={2}
                value={item.description || ''}
                onChange={(e) => handleUpdate(index, { description: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

