import React from 'react';
import { Plus, Trash2, Award } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { Certification } from '../../types';

interface CertificationsFormProps {
  items: Certification[];
  onChange: (items: Certification[]) => void;
}

export const CertificationsForm: React.FC<CertificationsFormProps> = ({ items, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...items,
      {
        name: '',
        issuer: '',
        date: '',
        expiryDate: '',
        credentialId: '',
        url: '',
      },
    ]);
  };

  const handleUpdate = (index: number, fields: Partial<Certification>) => {
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
          <h3 className="text-base font-bold text-charcoal">Certifications</h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            Add industry certifications, licenses, and verified credentials (e.g. AWS, GCP, Oracle).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Certification
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-charcoal">No certifications added yet</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Highlight credentials from cloud providers, Coursera, HackerRank, etc.
          </p>
          <Button size="sm" variant="primary" onClick={handleAdd}>
            Add Certification
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
                  Certification #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Certification Name"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={item.name}
                  onChange={(e) => handleUpdate(index, { name: e.target.value })}
                  required
                />
                <Input
                  label="Issuing Organization"
                  placeholder="e.g. Amazon Web Services"
                  value={item.issuer || ''}
                  onChange={(e) => handleUpdate(index, { issuer: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Issue Date"
                  placeholder="e.g. Mar 2024"
                  value={item.date || ''}
                  onChange={(e) => handleUpdate(index, { date: e.target.value })}
                />
                <Input
                  label="Credential ID"
                  placeholder="e.g. AWS-12345678"
                  value={item.credentialId || ''}
                  onChange={(e) => handleUpdate(index, { credentialId: e.target.value })}
                />
                <Input
                  label="Credential URL"
                  placeholder="https://..."
                  value={item.url || ''}
                  onChange={(e) => handleUpdate(index, { url: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
