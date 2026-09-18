import React, { useState, useEffect, useRef, useMemo } from 'react';
import { addressService, AddressSuggestion, extractDepartmentFromAddress } from '../services/addressService';

export type { AddressSuggestion };

export interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestion) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  isDestination?: boolean;
  className?: string;
  showCategoryFilters?: boolean;
  onSelectFacility?: (facilityName: string, accessNotes?: string) => void;
  icon?: string;
  helperText?: string;
  allowManualEntry?: boolean;
  showCategories?: boolean;
  showQuickCommunes?: boolean;
  defaultFilter?: string;
  referenceAddress?: string;
  referenceDepartment?: string;
  onSelectSuggestion?: (suggestion: AddressSuggestion) => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  id,
  value,
  onChange,
  placeholder = "Saisissez une adresse ou un établissement de santé...",
  label,
  required = false,
  isDestination = false,
  className = '',
  showCategoryFilters = false,
  onSelectFacility,
  icon,
  helperText,
  allowManualEntry = true,
  showCategories,
  showQuickCommunes = false,
  defaultFilter,
  referenceAddress,
  referenceDepartment,
  onSelectSuggestion,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(
    defaultFilter && defaultFilter !== 'etablissement' ? defaultFilter : 'ALL'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Détection territoriale dynamique du département
  const refDept = useMemo(() => {
    return referenceDepartment || extractDepartmentFromAddress(referenceAddress || inputValue || '') || undefined;
  }, [referenceDepartment, referenceAddress, inputValue]);

  // Communes d'accès rapide adaptées au secteur géographique
  const quickCommunesList = useMemo(() => {
    if (refDept === '31') return ['Toulouse', 'Blagnac', 'Colomiers', 'Tournefeuille', 'Muret'];
    if (refDept === '75' || ['92', '93', '94', '77', '78', '91', '95'].includes(refDept || '')) {
      return ['Paris', 'Boulogne-Billancourt', 'Créteil', 'Saint-Denis', 'Argenteuil'];
    }
    if (refDept === '69') return ['Lyon', 'Villeurbanne', 'Vénissieux', 'Bron', 'Caluire-et-Cuire'];
    if (refDept === '13') return ['Marseille', 'Aix-en-Provence', 'Aubagne', 'Marignane', 'La Ciotat'];
    if (refDept === '33') return ['Bordeaux', 'Mérignac', 'Pessac', 'Talence', 'Bègles'];
    if (refDept === '59') return ['Lille', 'Tourcoing', 'Roubaix', 'Dunkerque', 'Valenciennes'];
    if (refDept === '44') return ['Nantes', 'Saint-Nazaire', 'Saint-Herblain', 'Rezé', 'Orvault'];
    if (refDept === '35') return ['Rennes', 'Saint-Malo', 'Fougères', 'Cesson-Sévigné'];
    if (refDept === '67') return ['Strasbourg', 'Schiltigheim', 'Illkirch-Graffenstaden', 'Haguenau'];
    if (refDept === '971') return ['Pointe-à-Pitre', 'Les Abymes', 'Baie-Mahault', 'Basse-Terre', 'Le Gosier'];
    if (refDept === '972') return ['Fort-de-France', 'Le Lamentin', 'Schoelcher', 'Le Robert', 'Le Marin'];
    if (refDept === '973') return ['Cayenne', 'Kourou', 'Saint-Laurent-du-Maroni', 'Matoury', 'Remire-Montjoly'];
    if (refDept === '974') return ['Saint-Denis', 'Saint-Paul', 'Saint-Pierre', 'Le Tampon', 'Saint-André'];
    return ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Lille', 'Nantes', 'Strasbourg', 'Fort-de-France'];
  }, [refDept]);

  const territoryFooterLabel = useMemo(() => {
    if (refDept === '75' || ['92', '93', '94', '77', '78', '91', '95'].includes(refDept || '')) return 'Paris & Île-de-France';
    if (refDept === '69') return 'Rhône / Lyon (69)';
    if (refDept === '13') return 'Bouches-du-Rhône / Marseille (13)';
    if (refDept === '33') return 'Gironde / Bordeaux (33)';
    if (refDept === '31') return 'Haute-Garonne / Toulouse (31)';
    if (refDept === '59') return 'Nord / Lille (59)';
    if (refDept === '44') return 'Loire-Atlantique / Nantes (44)';
    if (refDept === '35') return 'Ille-et-Vilaine / Rennes (35)';
    if (refDept === '67') return 'Alsace / Strasbourg (67)';
    if (refDept === '06') return 'Alpes-Maritimes / Nice (06)';
    if (refDept === '34') return 'Hérault / Montpellier (34)';
    if (refDept === '38') return 'Isère / Grenoble (38)';
    if (refDept === '29') return 'Finistère / Brest (29)';
    if (refDept === '971') return 'Guadeloupe (971)';
    if (refDept === '972') return 'Martinique (972)';
    if (refDept === '973') return 'Guyane (973)';
    if (refDept === '974') return 'La Réunion (974)';
    if (refDept) return `Secteur Dépt ${refDept}`;
    return 'Couverture Nationale (France & DOM)';
  }, [refDept]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (!isOpen) return;

    // Pour le point de départ : pas d'établissements spontanés si champ vide
    if (!isDestination && (!inputValue || inputValue.trim().length < 2)) {
      setSuggestions([]);
      return;
    }

    // Pour la destination de soins : proposer immédiatement les hôpitaux et cliniques proches du point de départ
    if (isDestination && (!inputValue || inputValue.trim().length < 2)) {
      const facilities = addressService.searchFacilities('', {
        includeFacilities: true,
        categoryFilter: activeCategory !== 'ALL' ? activeCategory : undefined,
        referenceAddress,
        referenceDepartment: refDept,
      });
      setSuggestions(facilities);
      return;
    }

    // Saisie active d'une adresse ou établissement (>= 2 caractères)
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await addressService.searchCombined(inputValue, {
          includeFacilities: true,
          categoryFilter: activeCategory !== 'ALL' ? activeCategory : undefined,
          referenceAddress,
          referenceDepartment: refDept,
        });
        setSuggestions(results);
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [inputValue, activeCategory, isOpen, isDestination, referenceAddress, refDept]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setInputValue(nextVal);
    onChange(nextVal);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.address);
    onChange(suggestion.address, suggestion);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
    setIsOpen(false);

    if (onSelectFacility && suggestion.facility) {
      onSelectFacility(suggestion.facility.name, suggestion.facility.ambulanceAccessNotes);
    }
  };

  const handleManualUse = () => {
    onChange(inputValue);
    setIsOpen(false);
  };

  const handleGeolocation = async () => {
    setIsLocating(true);
    try {
      const pos = await addressService.getCurrentPositionAddress();
      if (pos) {
        setInputValue(pos.address);
        onChange(pos.address);
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative flex flex-col gap-1 w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="font-label-md text-label-md text-on-surface font-bold flex items-center justify-between" htmlFor={id}>
          <span>
            {label} {required && <span className="text-error">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-3 text-on-surface-variant material-symbols-outlined text-[20px] pointer-events-none">
          {icon || (isDestination ? 'local_hospital' : 'location_on')}
        </span>

        <input
          autoComplete="off"
          className="w-full h-11 pl-10 pr-20 rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-sm transition-all placeholder:text-on-surface-variant/60"
          id={id}
          onBlur={() => {
            // small delay to allow click on suggestion
            setTimeout(() => {
              if (document.activeElement !== inputRef.current) {
                // leave as manual value
              }
            }, 200);
          }}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (isDestination && (!inputValue || inputValue.trim().length < 2)) {
              const facilities = addressService.searchFacilities('', {
                includeFacilities: true,
                categoryFilter: activeCategory !== 'ALL' ? activeCategory : undefined,
                referenceAddress,
                referenceDepartment: refDept,
              });
              setSuggestions(facilities);
            }
          }}
          onClick={() => {
            setIsOpen(true);
            if (isDestination && (!inputValue || inputValue.trim().length < 2)) {
              const facilities = addressService.searchFacilities('', {
                includeFacilities: true,
                categoryFilter: activeCategory !== 'ALL' ? activeCategory : undefined,
                referenceAddress,
                referenceDepartment: refDept,
              });
              setSuggestions(facilities);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          required={required}
          type="text"
          value={inputValue}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && (
            <button
              className="p-1 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
              onClick={() => {
                setInputValue('');
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              title="Effacer l'adresse"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          {!isDestination && (
            <button
              className={`p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors flex items-center justify-center ${
                isLocating ? 'animate-pulse text-secondary' : ''
              }`}
              onClick={handleGeolocation}
              title="Utiliser ma position GPS"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLocating ? 'radar' : 'my_location'}
              </span>
            </button>
          )}
        </div>
      </div>

      {helperText && (
        <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
          {helperText}
        </span>
      )}

      {showQuickCommunes && (
        <div className="flex gap-1.5 flex-wrap mt-0.5">
          {quickCommunesList.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setInputValue(c);
                onChange(c);
              }}
              className="px-2.5 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors border border-outline-variant/30 text-[11px]"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 z-50 overflow-hidden max-h-[380px] flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Category Filter Pills (if enabled) */}
          {(showCategoryFilters || showCategories) && (
            <div className="flex items-center gap-1.5 p-2 bg-surface-container-low border-b border-outline-variant/20 overflow-x-auto text-xs">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'HOSPITAL', label: 'CHU & Hôpitaux' },
                { id: 'CLINIC', label: 'Cliniques' },
                { id: 'DIALYSIS', label: 'Dialyse' },
                { id: 'SSR', label: 'SSR / Rééduc.' },
                { id: 'EHPAD', label: 'EHPAD' },
              ].map(tab => (
                <button
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                    activeCategory === tab.id
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Saisie manuelle directe option */}
          {inputValue.trim().length > 0 && (
            <div
              className="p-2.5 bg-primary/5 hover:bg-primary/10 border-b border-outline-variant/20 flex items-center justify-between cursor-pointer transition-colors"
              onClick={handleManualUse}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="material-symbols-outlined text-primary text-lg shrink-0">edit_location</span>
                <div className="flex flex-col truncate">
                  <span className="font-label-md text-label-md text-primary font-bold truncate">
                    Utiliser comme adresse personnalisée :
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface truncate">
                    "{inputValue}"
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary text-on-primary shrink-0">
                Valider saisie
              </span>
            </div>
          )}

          {/* Encart titre Hôpitaux & Cliniques recommandés */}
          {isDestination && (!inputValue || inputValue.trim().length < 2) && (
            <div className="px-3 py-2 bg-primary/10 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-primary text-[17px] shrink-0">local_hospital</span>
                <span className="font-bold text-xs text-primary truncate">
                  {refDept
                    ? 'Hôpitaux & Cliniques proches de votre départ'
                    : 'Grands CHU & Pôles Hospitaliers de Référence'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary/90 bg-surface-container-lowest px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                {territoryFooterLabel}
              </span>
            </div>
          )}

          {/* Suggestions List */}
          <div className="overflow-y-auto divide-y divide-outline-variant/10 py-1">
            {isLoading ? (
              <div className="p-4 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-primary animate-spin text-lg">sync</span>
                <span>Recherche d'adresses et d'établissements...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-4 text-center text-on-surface-variant text-sm flex flex-col gap-1">
                <span>Aucun établissement ou adresse préenregistrée trouvé.</span>
                <span className="text-xs text-secondary font-medium">
                  Vous pouvez saisir votre adresse manuellement en toute liberté.
                </span>
              </div>
            ) : (
              suggestions.map((suggestion, index) => {
                const isSelected = index === selectedIndex;
                const isFacility = suggestion.type === 'FACILITY';

                return (
                  <div
                    className={`px-3 py-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isFacility
                          ? 'bg-primary-container/20 text-primary'
                          : suggestion.type === 'BAN_ADDRESS'
                          ? 'bg-blue-500/15 text-blue-700'
                          : suggestion.type === 'GOOGLE_MAPS'
                          ? 'bg-secondary-container/20 text-secondary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isFacility
                          ? suggestion.facility?.category === 'DIALYSIS'
                            ? 'water_drop'
                            : suggestion.facility?.category === 'ONCOLOGY'
                            ? 'vital_signs'
                            : 'local_hospital'
                          : suggestion.type === 'BAN_ADDRESS'
                          ? 'home_pin'
                          : suggestion.type === 'GOOGLE_MAPS'
                          ? 'share_location'
                          : 'location_on'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                          {suggestion.label}
                        </span>
                        {suggestion.categoryLabel && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isFacility
                                ? 'bg-primary/10 text-primary'
                                : suggestion.type === 'BAN_ADDRESS'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {suggestion.categoryLabel}
                          </span>
                        )}
                      </div>

                      {suggestion.secondaryText && (
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5 line-clamp-1">
                          {suggestion.secondaryText}
                        </span>
                      )}

                      {suggestion.facility?.ambulanceAccessNotes && (
                        <div className="flex items-center gap-1 text-[11px] text-secondary font-medium mt-1">
                          <span className="material-symbols-outlined text-[13px]">info</span>
                          <span className="truncate">{suggestion.facility.ambulanceAccessNotes}</span>
                        </div>
                      )}
                    </div>

                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 shrink-0 self-center">
                      north_west
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-surface-container-low/70 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>{territoryFooterLabel} • Hôpitaux, cliniques &amp; adresses</span>
            <span className="font-semibold text-primary">Prescription Médicale CPAM</span>
          </div>
        </div>
      )}
    </div>
  );
};
