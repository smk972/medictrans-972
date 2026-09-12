import React from 'react';
import { MARTINIQUE_COMMUNES, MAJOR_FACILITIES } from '../services/rideService';
import { MapPin, Building2 } from 'lucide-react';

interface CommuneSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  includeFacilities?: boolean;
  id?: string;
}

export const CommuneSelect: React.FC<CommuneSelectProps> = ({
  value,
  onChange,
  placeholder = 'Sélectionnez une commune...',
  label,
  required = false,
  includeFacilities = false,
  id
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
        >
          <option value="" disabled>{placeholder}</option>

          {includeFacilities && (
            <optgroup label="Établissements Hospitaliers & Cliniques">
              {MAJOR_FACILITIES.map((f) => (
                <option key={f.name} value={`${f.name}, ${f.city}`}>
                  🏥 {f.name} ({f.city})
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="34 Communes de Martinique">
            {MARTINIQUE_COMMUNES.map((commune) => (
              <option key={commune} value={commune}>
                📍 {commune} (972)
              </option>
            ))}
          </optgroup>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <MapPin className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
