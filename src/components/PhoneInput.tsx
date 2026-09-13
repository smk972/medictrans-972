import React, { useState, useEffect, useRef } from 'react';

export interface CountryDialCode {
  id: string;
  code: string; // e.g. '+596'
  dialCode: string; // '596'
  country: string;
  flag: string;
  region: string;
  placeholder: string;
  mobilePrefixes: string[];
}

export const SUPPORTED_DIAL_CODES: CountryDialCode[] = [
  {
    id: 'mq',
    code: '+596',
    dialCode: '596',
    country: 'Martinique',
    flag: '🇲🇶',
    region: 'Antilles (972)',
    placeholder: '06 96 XX XX XX',
    mobilePrefixes: ['0696', '696'],
  },
  {
    id: 'gp',
    code: '+590',
    dialCode: '590',
    country: 'Guadeloupe',
    flag: '🇬🇵',
    region: 'St-Martin / St-Barth (971)',
    placeholder: '06 90 XX XX XX',
    mobilePrefixes: ['0690', '690'],
  },
  {
    id: 'gf',
    code: '+594',
    dialCode: '594',
    country: 'Guyane',
    flag: '🇬🇫',
    region: 'Guyane Française (973)',
    placeholder: '06 94 XX XX XX',
    mobilePrefixes: ['0694', '694'],
  },
  {
    id: 're',
    code: '+262',
    dialCode: '262',
    country: 'La Réunion',
    flag: '🇷🇪',
    region: 'Océan Indien (974)',
    placeholder: '06 92 XX XX XX',
    mobilePrefixes: ['0692', '0693', '692', '693'],
  },
  {
    id: 'fr',
    code: '+33',
    dialCode: '33',
    country: 'France Hexagone',
    flag: '🇫🇷',
    region: 'Métropole',
    placeholder: '06 XX XX XX XX',
    mobilePrefixes: ['06', '07', '6', '7'],
  },
];

export interface PhoneChangeDetails {
  dialCode: string; // '+596'
  rawNumber: string; // '0696442018'
  fullInternational: string; // '+596696442018'
  e164: string; // '596696442018'
  formatted: string; // '+596 6 96 44 20 18'
  isMobile: boolean;
  isValid: boolean;
  country: CountryDialCode;
}

export interface PhoneInputProps {
  id?: string;
  value?: string;
  onChange: (fullNumber: string, details?: PhoneChangeDetails) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  defaultDialCode?: string; // '+596' by default
  helperText?: string;
  className?: string;
  variant?: 'primary' | 'whatsapp';
  showValidation?: boolean;
}

// Format number in chunks of 2 (e.g. "06 96 44 20 18")
function formatFrenchNumber(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').slice(0, 10);
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    parts.push(cleaned.slice(i, i + 2));
  }
  return parts.join(' ');
}

// Parse existing string to extract dial code and local number
function parseInitialPhone(val: string, defaultCode: string = '+596'): { country: CountryDialCode; local: string } {
  if (!val) {
    const matched = SUPPORTED_DIAL_CODES.find((c) => c.code === defaultCode) || SUPPORTED_DIAL_CODES[0];
    return { country: matched, local: '' };
  }

  const trimmed = val.trim();

  for (const c of SUPPORTED_DIAL_CODES) {
    if (trimmed.startsWith(c.code)) {
      const remaining = trimmed.substring(c.code.length).trim();
      return { country: c, local: formatFrenchNumber(remaining) };
    }
  }

  // Check French overseas prefixes from standard 10-digit formats
  const cleanDigits = trimmed.replace(/\D/g, '');
  if (cleanDigits.startsWith('0696') || cleanDigits.startsWith('0596')) {
    const mq = SUPPORTED_DIAL_CODES.find((c) => c.code === '+596')!;
    return { country: mq, local: formatFrenchNumber(cleanDigits) };
  } else if (cleanDigits.startsWith('0690') || cleanDigits.startsWith('0590')) {
    const gp = SUPPORTED_DIAL_CODES.find((c) => c.code === '+590')!;
    return { country: gp, local: formatFrenchNumber(cleanDigits) };
  } else if (cleanDigits.startsWith('0694') || cleanDigits.startsWith('0594')) {
    const gf = SUPPORTED_DIAL_CODES.find((c) => c.code === '+594')!;
    return { country: gf, local: formatFrenchNumber(cleanDigits) };
  } else if (cleanDigits.startsWith('0692') || cleanDigits.startsWith('0693') || cleanDigits.startsWith('0262')) {
    const re = SUPPORTED_DIAL_CODES.find((c) => c.code === '+262')!;
    return { country: re, local: formatFrenchNumber(cleanDigits) };
  }

  const defaultCountry = SUPPORTED_DIAL_CODES.find((c) => c.code === defaultCode) || SUPPORTED_DIAL_CODES[0];
  return { country: defaultCountry, local: formatFrenchNumber(cleanDigits) };
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id,
  value = '',
  onChange,
  label,
  required = false,
  placeholder,
  defaultDialCode = '+596',
  helperText,
  className = '',
  variant = 'primary',
  showValidation = true,
}) => {
  const initial = parseInitialPhone(value, defaultDialCode);
  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(initial.country);
  const [localNumber, setLocalNumber] = useState<string>(initial.local);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when prop value changes externally
  useEffect(() => {
    if (value) {
      const parsed = parseInitialPhone(value, selectedCountry.code);
      setSelectedCountry(parsed.country);
      setLocalNumber(parsed.local);
    }
  }, [value]);

  // Click outside to close country dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const computeDetails = (country: CountryDialCode, numStr: string): PhoneChangeDetails => {
    const digits = numStr.replace(/\D/g, '');
    let e164National = digits;
    if (e164National.startsWith('0')) {
      e164National = e164National.substring(1);
    }

    const e164 = `${country.dialCode}${e164National}`;
    const fullInternational = `${country.code} ${numStr.trim()}`;

    // Mobile check
    const isMobile = country.mobilePrefixes.some((p) => {
      const cleanP = p.startsWith('0') ? p.substring(1) : p;
      return e164National.startsWith(cleanP) || digits.startsWith(p);
    });

    const isValid = digits.length >= 9 && digits.length <= 10;

    return {
      dialCode: country.code,
      rawNumber: digits,
      fullInternational,
      e164,
      formatted: `${country.code} ${numStr}`,
      isMobile,
      isValid,
      country,
    };
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatFrenchNumber(e.target.value);
    setLocalNumber(formatted);
    const details = computeDetails(selectedCountry, formatted);
    onChange(details.formatted, details);
  };

  const handleCountrySelect = (country: CountryDialCode) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    const details = computeDetails(country, localNumber);
    onChange(details.formatted, details);
    inputRef.current?.focus();
  };

  const isWhatsapp = variant === 'whatsapp';
  const details = computeDetails(selectedCountry, localNumber);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className || ''}`} ref={containerRef}>
      {label && (
        <label className="font-label-md text-label-md text-on-surface font-semibold text-xs flex items-center justify-between h-5" htmlFor={id}>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {isWhatsapp && (
              <span className="material-symbols-outlined text-sm text-emerald-600">smartphone</span>
            )}
            {label} {required && <span className="text-error">*</span>}
          </span>
          {showValidation && localNumber && (
            <span
              className={`text-[11px] font-medium flex items-center gap-1 ${
                details.isValid
                  ? isWhatsapp
                    ? details.isMobile
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                    : 'text-secondary'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {details.isValid ? 'check_circle' : 'info'}
              </span>
              {details.isValid
                ? isWhatsapp
                  ? details.isMobile
                    ? 'Mobile WhatsApp compatible'
                    : 'Numéro fixe détecté'
                  : 'Numéro complet'
                : '9 ou 10 chiffres'}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Country dial code trigger */}
        <div className="relative">
          <button
            type="button"
            className={`h-11 pl-3 pr-2.5 rounded-l-xl bg-surface-container-low border border-r-0 border-outline-variant/40 flex items-center gap-1.5 hover:bg-surface-container transition-colors text-xs font-bold text-on-surface select-none ${
              isWhatsapp ? 'focus:ring-2 focus:ring-emerald-500' : 'focus:ring-2 focus:ring-primary'
            }`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            title="Changer l'indicatif téléphonique (+33, +596, +590, +594, +262)"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="font-semibold text-on-surface">{selectedCountry.code}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px] -ml-0.5">
              arrow_drop_down
            </span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 bg-surface-container-low/70 border-b border-outline-variant/20 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Indicatifs autorisés
              </div>
              <div className="divide-y divide-outline-variant/10">
                {SUPPORTED_DIAL_CODES.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-surface-container transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'
                      }`}
                      onClick={() => handleCountrySelect(c)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{c.flag}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold leading-tight">{c.country}</span>
                          <span className="text-[10px] text-on-surface-variant leading-tight">{c.region}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {c.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Local phone number input */}
        <input
          ref={inputRef}
          id={id}
          type="tel"
          required={required}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || selectedCountry.placeholder}
          className={`w-full h-11 px-3.5 bg-surface-container-lowest rounded-r-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 outline-none transition-all shadow-xs text-xs font-mono tracking-wide ${
            isWhatsapp
              ? 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
              : 'focus:ring-2 focus:ring-primary focus:border-primary'
          }`}
          autoComplete="tel-national"
        />
      </div>

      {helperText && (
        <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
          {helperText}
        </span>
      )}
    </div>
  );
};
