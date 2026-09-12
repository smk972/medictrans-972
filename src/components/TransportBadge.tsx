import React from 'react';
import { TransportType } from '../types';
import { Ambulance, Car, ShieldAlert } from 'lucide-react';

interface TransportBadgeProps {
  type: TransportType;
  showDetails?: boolean;
}

export const TransportBadge: React.FC<TransportBadgeProps> = ({ type, showDetails = false }) => {
  if (type === 'AMBULANCE') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
        <Ambulance className="w-4 h-4 text-red-600" />
        <span>Ambulance</span>
        {showDetails && <span className="text-[10px] font-normal text-red-600 ml-1">(Surveillance / Brancard)</span>}
      </div>
    );
  }

  if (type === 'VSL') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
        <Car className="w-4 h-4 text-teal-600" />
        <span>VSL</span>
        {showDetails && <span className="text-[10px] font-normal text-teal-600 ml-1">(Assistance / Position assise)</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
      <Car className="w-4 h-4 text-amber-600" />
      <span>Taxi Conventionné</span>
      {showDetails && <span className="text-[10px] font-normal text-amber-700 ml-1">(Autonome assis / CPAM)</span>}
    </div>
  );
};
