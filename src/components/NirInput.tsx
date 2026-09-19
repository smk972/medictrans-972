import React, { useMemo } from 'react';
import { validateNir, formatNir, autoFixNir } from '../utils/nirValidator';

interface NirInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (formattedValue: string, isValid: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const NirInput: React.FC<NirInputProps> = ({
  id = 'nir-input',
  label = 'Numéro de Sécurité Sociale (NIR)',
  value,
  onChange,
  required = true,
  disabled = false,
  className = '',
  showDetails = true,
}) => {
  const validation = useMemo(() => validateNir(value), [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatNir(raw);
    const result = validateNir(formatted);
    onChange(formatted, result.isValid);
  };

  const handleApplyKey = () => {
    const fixed = autoFixNir(value);
    const result = validateNir(fixed);
    onChange(fixed, result.isValid);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Header with Label and Status Badge */}
      <div className="flex justify-between items-center h-5">
        <label htmlFor={id} className="font-label-md text-label-md text-on-surface font-semibold text-xs flex items-center">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
        
        {validation.isValid ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            NIR Conforme
          </span>
        ) : required ? (
          <span className="font-label-sm text-label-sm text-rose-600 font-bold text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Obligatoire CPAM
          </span>
        ) : (
          <span className="font-label-sm text-label-sm text-secondary font-bold text-xs">
            13 chiffres (Sécurité Sociale)
          </span>
        )}
      </div>

      {/* Input container */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined text-outline absolute left-3 text-[20px] pointer-events-none">
          badge
        </span>

        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          maxLength={21}
          placeholder="1 XX XX XX XXX XXX"
          className={`w-full h-11 px-3 pl-10 pr-10 bg-surface-container-lowest rounded-xl font-mono text-body-md text-on-surface border transition-all outline-none shadow-xs ${
            validation.isValid
              ? 'border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/30'
              : value && value.trim().length > 0
              ? 'border-amber-500/70 focus:ring-2 focus:ring-amber-500/30'
              : 'border-outline-variant/40 focus:ring-2 focus:ring-primary'
          }`}
          required={required}
          aria-invalid={!validation.isValid}
          aria-describedby={`${id}-help`}
        />

        {/* Status Icon in input */}
        <div className="absolute right-3 flex items-center">
          {validation.isValid ? (
            <span className="material-symbols-outlined text-emerald-600 text-[20px]" title="Numéro de Sécurité Sociale valide">
              check_circle
            </span>
          ) : value && value.trim().length > 0 ? (
            <span className="material-symbols-outlined text-amber-500 text-[20px]" title={validation.errorMessage}>
              warning
            </span>
          ) : (
            <span className="text-[11px] font-mono text-on-surface-variant/60 font-semibold">
              13 chiffres
            </span>
          )}
        </div>
      </div>

      {/* Helper / Error / Auto-fix guidance */}
      {showDetails && (
        <div id={`${id}-help`} className="flex flex-col gap-1 text-xs">
          {validation.isValid ? (
            <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100">
              <span>
                Patient {validation.gender === 'M' ? 'Masculin' : 'Féminin'} • Né(e) en 19{validation.birthYear?.toString().padStart(2, '0')} / 20{validation.birthYear?.toString().padStart(2, '0')} (Mois {validation.birthMonth?.toString().padStart(2, '0')})
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="material-symbols-outlined text-xs">verified</span>
                Format NIR validé
              </span>
            </div>
          ) : value && value.trim().length > 0 ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-amber-600 text-sm shrink-0">info</span>
                <span className="truncate">{validation.errorMessage}</span>
              </div>

              {validation.canAutoCalculateKey && validation.expectedControlKey && (
                <button
                  type="button"
                  onClick={handleApplyKey}
                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shrink-0 transition-colors shadow-xs"
                >
                  Appliquer clé {validation.expectedControlKey}
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-on-surface-variant font-medium">
              <strong className="text-rose-600 font-bold">* Obligatoire CPAM / CGSS :</strong> 13 chiffres d'immatriculation inscrits sur votre Carte Vitale ou attestation de droits.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
