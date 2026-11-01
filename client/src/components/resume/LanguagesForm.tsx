import React from 'react';
import { Plus, Trash2, Languages as LangIcon } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { Language } from '../../types';

interface LanguagesFormProps {
  items: Language[];
  onChange: (items: Language[]) => void;
}

const PROFICIENCY_LEVELS = [
  'Native / Bilingual',
  'Fluent',
  'Professional Working',
  'Intermediate',
  'Elementary / Basic',
];

export const LanguagesForm: React.FC<LanguagesFormProps> = ({ items, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...items,
      {
        name: '',
        proficiency: PROFICIENCY_LEVELS[1],
      },
    ]);
  };

  const handleUpdate = (index: number, fields: Partial<Language>) => {
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
          <h3 className="text-base font-bold text-charcoal">Languages</h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            Add spoken and written languages and your proficiency level.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Language
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <LangIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-charcoal">No languages added yet</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Add languages you speak or write professionally.
          </p>
          <Button size="sm" variant="primary" onClick={handleAdd}>
            Add Language
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Language #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Input
                label="Language"
                placeholder="e.g. English, Spanish, German"
                value={item.name}
                onChange={(e) => handleUpdate(index, { name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  Proficiency Level
                </label>
                <select
                  value={item.proficiency || PROFICIENCY_LEVELS[1]}
                  onChange={(e) => handleUpdate(index, { proficiency: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PROFICIENCY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

