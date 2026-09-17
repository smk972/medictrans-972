import React, { useState, useEffect, useRef } from 'react';

interface SimulationStep {
  id: number;
  label: string;
  narrative: string;
  cursorX: number; // percentage
  cursorY: number; // percentage
  durationMs: number;
  action: (state: ConsoleState, setState: React.Dispatch<React.SetStateAction<ConsoleState>>) => void;
}

interface ConsoleState {
  radius: number;
  availableCount: number;
  activeMissionsCount: number;
  selectedVehicleFilter: 'TOUS' | 'AMBULANCE' | 'VSL' | 'TAXI';
  nominativeAccepted: boolean;
  isAccepting: boolean;
  toastMessage: string | null;
}

const INITIAL_CONSOLE_STATE: ConsoleState = {
  radius: 15,
  availableCount: 14,
  activeMissionsCount: 7,
  selectedVehicleFilter: 'TOUS',
  nominativeAccepted: false,
  isAccepting: false,
  toastMessage: null,
};

export const TransporterSimulatedConsole: React.FC = () => {
  const [consoleState, setConsoleState] = useState<ConsoleState>(INITIAL_CONSOLE_STATE);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 35 });
  const [clickEffectPos, setClickEffectPos] = useState<{ x: number; y: number; key: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Définition du scénario d'animation en 5 étapes réalistes
  const steps: SimulationStep[] = [
    {
      id: 0,
      label: 'Rayon d’action',
      narrative: 'Le régulateur élargit son rayon à 25 km pour capter davantage de courses',
      cursorX: 43,
      cursorY: 26.5,
      durationMs: 2700,
      action: (_state, setState) => {
        setState((prev) => ({
          ...prev,
          radius: 25,
          availableCount: 17,
          toastMessage: 'Périmètre étendu à 25 km (+3 courses détectées)',
        }));
      },
    },
    {
      id: 1,
      label: 'Demande urgente',
      narrative: 'Une course nominative directe à 24h apparaît au départ du CHU Zobda-Quitman',
      cursorX: 82,
      cursorY: 61.5,
      durationMs: 2800,
      action: (_state, setState) => {
        setState((prev) => ({
          ...prev,
          isAccepting: true,
          toastMessage: null,
        }));
      },
    },
    {
      id: 2,
      label: 'Validation 1 clic',
      narrative: 'Prise en charge instantanée en 1 clic — 0 % de commission retenue',
      cursorX: 82,
      cursorY: 61.5,
      durationMs: 3200,
      action: (_state, setState) => {
        setState((prev) => ({
          ...prev,
          isAccepting: false,
          nominativeAccepted: true,
          availableCount: 16,
          activeMissionsCount: 8,
          toastMessage: '✓ Course #MT-972-6214 affectée à l’équipage Ambulance 01 !',
        }));
      },
    },
    {
      id: 3,
      label: 'Filtre Véhicule',
      narrative: 'Filtrage instantané sur les demandes VSL disponibles',
      cursorX: 85.5,
      cursorY: 26.5,
      durationMs: 2700,
      action: (_state, setState) => {
        setState((prev) => ({
          ...prev,
          selectedVehicleFilter: 'VSL',
          toastMessage: null,
        }));
      },
    },
    {
      id: 4,
      label: 'Retour global',
      narrative: 'Synchronisation globale en temps réel avec tous les établissements de l’île',
      cursorX: 76,
      cursorY: 26.5,
      durationMs: 2800,
      action: (_state, setState) => {
        setState((prev) => ({
          ...prev,
          selectedVehicleFilter: 'TOUS',
          toastMessage: null,
        }));
      },
    },
  ];

  // Boucle de simulation automatique
  useEffect(() => {
    const currentStep = steps[currentStepIndex];

    // Déplacement fluide de la souris
    setMousePos({ x: currentStep.cursorX, y: currentStep.cursorY });

    // Déclenchement du clic simulé au milieu de l'étape
    const clickTimer = setTimeout(() => {
      setIsClicking(true);
      setClickEffectPos({ x: currentStep.cursorX, y: currentStep.cursorY, key: Date.now() });
      currentStep.action(consoleState, setConsoleState);

      const unclickTimer = setTimeout(() => {
        setIsClicking(false);
      }, 300);

      return () => clearTimeout(unclickTimer);
    }, currentStep.durationMs * 0.45);

    // Passage à l'étape suivante
    const nextStepTimer = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          // Réinitialisation douce de la simulation
          setConsoleState(INITIAL_CONSOLE_STATE);
          return 0;
        }
        return next;
      });
    }, currentStep.durationMs);

    return () => {
      clearTimeout(clickTimer);
      clearTimeout(nextStepTimer);
    };
  }, [currentStepIndex]);

  const currentNarrative = steps[currentStepIndex]?.narrative || '';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Barre de fenêtre style macOS épurée */}
      <div className="flex items-center pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Cadre de la console avec curseur animé */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-900 select-none text-slate-800"
        style={{ minHeight: '560px' }}
      >
        {/* Contenu principal de la console dispatch (Layout Bureau Réel) */}
        <div className="flex h-full min-h-[560px] flex-col md:flex-row bg-[#F8FAFC]">
          {/* Sidebar Transporteur */}
          <div className="w-full md:w-56 bg-[#041E24] text-slate-200 p-4 shrink-0 flex flex-col justify-between border-r border-teal-950/40">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-teal-900/40">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-sm">
                  C
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1">
                    clinigo.fr <span className="text-[9px] px-1 rounded bg-teal-500/20 text-teal-300">PRO</span>
                  </div>
                  <div className="text-[10px] text-teal-300/70">Réseau Sanitaire 972</div>
                </div>
              </div>

              {/* Société active */}
              <div className="p-2.5 rounded-xl bg-teal-950/50 border border-teal-800/30 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
                  🚑
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold text-white truncate">Madinina Secours</div>
                  <div className="text-[9px] text-teal-400">Agréé ARS & CPAM</div>
                </div>
              </div>

              {/* Menu Navigation */}
              <nav className="space-y-1 text-xs">
                <div className="px-3 py-2 rounded-xl bg-teal-800 text-white font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">radar</span>
                    Courses disponibles
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                    {consoleState.availableCount}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl text-teal-200/70 hover:bg-teal-900/30 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">directions_car</span>
                    En cours
                  </span>
                  <span className="text-[10px] font-bold text-teal-400">{consoleState.activeMissionsCount}</span>
                </div>
                <div className="px-3 py-2 rounded-xl text-teal-200/70 hover:bg-teal-900/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  Planning
                </div>
                <div className="px-3 py-2 rounded-xl text-teal-200/70 hover:bg-teal-900/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  Flotte & Équipages
                </div>
                <div className="px-3 py-2 rounded-xl text-teal-200/70 hover:bg-teal-900/30 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Abonnement
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                    19,90 €
                  </span>
                </div>
              </nav>
            </div>

            <div className="pt-4 border-t border-teal-900/40 text-[10px] text-teal-300/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Connecté en direct</span>
            </div>
          </div>

          {/* Zone de travail centrale du Dashboard */}
          <div className="flex-1 p-4 sm:p-5 overflow-hidden flex flex-col justify-between space-y-4">
            {/* Header supérieur de la console */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Console de Dispatching Sanitaire
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Flux hospitalier temps réel • CHU Zobda-Quitman, Mangot-Vulcin & Cliniques
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-teal-600 animate-spin">refresh</span>
                    Rafraîchir
                  </span>
                </div>
              </div>

              {/* Ligne des compteurs KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Disponibles</div>
                  <div className="text-xl font-black text-slate-900 flex items-center gap-1.5">
                    <span>{consoleState.availableCount}</span>
                    <span className="text-[10px] font-normal text-teal-700 font-sans">en attente</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">En approche</div>
                  <div className="text-xl font-black text-slate-900 flex items-center gap-1.5">
                    <span>{consoleState.activeMissionsCount}</span>
                    <span className="text-[10px] font-normal text-slate-500 font-sans">actives</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Clôturées</div>
                  <div className="text-xl font-black text-slate-900">2</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Flotte prête</div>
                  <div className="text-xl font-black text-emerald-700">3/3</div>
                </div>
              </div>

              {/* Barre de filtrage interactif (Rayon d'action + Type de véhicule) */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-600 font-bold text-[11px] flex items-center gap-1 mr-1">
                    <span className="material-symbols-outlined text-sm text-teal-700">near_me</span>
                    Rayon :
                  </span>
                  {[10, 15, 25, 40].map((km) => {
                    const isHoveredBySim = currentStepIndex === 0 && km === 25;
                    return (
                      <button
                        key={km}
                        type="button"
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                          consoleState.radius === km
                            ? 'bg-teal-700 text-white shadow-xs scale-105 ring-2 ring-teal-500/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        } ${isHoveredBySim ? 'ring-4 ring-teal-400/60 scale-110 shadow-md' : ''}`}
                      >
                        {km} km
                      </button>
                    );
                  })}
                  <span className="text-[10px] text-teal-700 font-semibold ml-1">
                    (Base : Le Lamentin)
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 font-bold mr-1">Véhicule :</span>
                  {(['TOUS', 'AMBULANCE', 'VSL'] as const).map((v) => {
                    const isHoveredBySim =
                      (currentStepIndex === 3 && v === 'VSL') || (currentStepIndex === 4 && v === 'TOUS');
                    return (
                      <span
                        key={v}
                        className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                          consoleState.selectedVehicleFilter === v
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                        } ${isHoveredBySim ? 'ring-2 ring-teal-500 scale-105' : ''}`}
                      >
                        {v === 'TOUS' ? 'Tous' : v}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Liste des départs et bandeau d'urgence */}
            <div className="space-y-2.5">
              {/* Carte 1 : Demande Directe Nominative Urgente (Marcel V.) */}
              <div
                className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-300 relative ${
                  consoleState.nominativeAccepted
                    ? 'bg-emerald-50/90 border-emerald-300'
                    : 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border-amber-300/80 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase flex items-center gap-1">
                        <span>🔥 Nominatif</span>
                        <span className="font-mono">19h rest.</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                        AMBULANCE
                      </span>
                      <span className="text-xs text-slate-700 font-mono font-bold">#MT-972-6214</span>
                      <span className="text-xs text-teal-800 font-bold">Sortie hospitalière</span>
                    </div>

                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>CHU Zobda-Quitman (Cardio)</span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-teal-900">Le Lamentin (Bourg)</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Patient : M. Marcel V. (ALD 100%)</span>
                      <span>•</span>
                      <span>7.8 km</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200/50">
                    <div className="text-right">
                      <span className="text-base font-black font-mono text-teal-900">~68,50 €</span>
                      <span className="text-[10px] text-slate-500 block">0% comm.</span>
                    </div>
                    <button
                      type="button"
                      className={`px-4 py-1.5 rounded-lg font-black text-xs transition-all shadow-xs flex items-center gap-1.5 ${
                        consoleState.nominativeAccepted
                          ? 'bg-emerald-600 text-white'
                          : consoleState.isAccepting
                          ? 'bg-teal-600 text-white animate-pulse'
                          : (currentStepIndex === 1 || currentStepIndex === 2)
                          ? 'bg-teal-800 text-white ring-4 ring-teal-400/60 scale-105 shadow-md'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      {consoleState.nominativeAccepted ? (
                        <>
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span>Acceptée • Ambulance 01</span>
                        </>
                      ) : consoleState.isAccepting ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                          <span>Affectation...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">task_alt</span>
                          <span>Valider la course</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Carte 2 : Course VSL standard (Éliane B.) */}
              {consoleState.selectedVehicleFilter !== 'AMBULANCE' && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                        VSL
                      </span>
                      <span className="text-slate-500 font-mono">#MT-972-3306</span>
                      <span className="text-teal-700 font-bold">Dans 35 min</span>
                    </div>
                    <div className="font-bold text-slate-800">
                      Clinique Sainte-Marie (Schoelcher) ➔ Fort-de-France (Cluny)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Patiente : Éliane B. • Chimiothérapie ambulatoire • 5.2 km
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="font-black font-mono text-teal-800 text-sm">~38,00 €</span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-teal-700 hover:text-white font-bold text-xs transition-colors"
                    >
                      Prendre
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Toast en direct (apparaît lors des actions) */}
            {consoleState.toastMessage && (
              <div className="p-2.5 rounded-xl bg-slate-900/95 text-white text-xs font-semibold flex items-center justify-between border border-teal-500/30 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{consoleState.toastMessage}</span>
                </div>
                <span className="text-[10px] text-teal-300 font-mono">Temps réel</span>
              </div>
            )}
          </div>
        </div>

        {/* Curseur souris simulé animé */}
        <div
          className="absolute pointer-events-none z-30 transition-all duration-700 ease-out"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: 'translate(-3px, -3px)',
          }}
        >
          {/* SVG Curseur souris réaliste macOS / Windows */}
          <div className="relative">
            <svg
              className={`w-6 h-6 drop-shadow-md transition-transform duration-150 ${
                isClicking ? 'scale-90' : 'scale-100'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.5 3.5L19 12.5L12 14.5L9.5 21L5.5 3.5Z"
                fill="#0F766E"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>

            {/* Bulle d'action flottante sous la souris */}
            <div className="absolute left-6 top-2 bg-teal-900/95 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xl border border-teal-400/40 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
              <span>Régulateur Clinigo</span>
            </div>
          </div>
        </div>

        {/* Halo de clic circulaire pulsant */}
        {clickEffectPos && (
          <div
            key={clickEffectPos.key}
            className="absolute pointer-events-none z-20 w-8 h-8 rounded-full border-2 border-teal-400 bg-teal-400/20 -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{
              left: `${clickEffectPos.x}%`,
              top: `${clickEffectPos.y}%`,
            }}
          />
        )}
      </div>

      {/* Barre de narration en bas : détaille ce que fait la souris en temps réel */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-black text-xs shrink-0">
            {currentStepIndex + 1}
          </div>
          <div>
            <span className="font-bold text-slate-900 block sm:inline mr-2">
              {steps[currentStepIndex]?.label} :
            </span>
            <span className="text-slate-600">{currentNarrative}</span>
          </div>
        </div>

        {/* Stepper dots */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentStepIndex === idx ? 'w-6 bg-teal-700' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={step.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
