import React from 'react';
import { RideStatus } from '../types';
import { Clock, CheckCircle2, Navigation, UserCheck, CheckCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: RideStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<RideStatus, { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'En attente d\'affectation',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
      icon: <Clock className="w-3.5 h-3.5" />
    },
    ACCEPTED: {
      label: 'Chauffeur attribué',
      bg: 'bg-sky-50 border-sky-200',
      text: 'text-sky-800',
      dot: 'bg-sky-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    EN_ROUTE: {
      label: 'Chauffeur en route',
      bg: 'bg-emerald-50 border-emerald-200 animate-pulse',
      text: 'text-emerald-800 font-bold',
      dot: 'bg-emerald-500',
      icon: <Navigation className="w-3.5 h-3.5" />
    },
    PICKED_UP: {
      label: 'Patient à bord',
      bg: 'bg-teal-50 border-teal-200',
      text: 'text-teal-800',
      dot: 'bg-teal-600',
      icon: <UserCheck className="w-3.5 h-3.5" />
    },
    COMPLETED: {
      label: 'Transport terminé',
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
      icon: <CheckCheck className="w-3.5 h-3.5" />
    },
    CANCELLED: {
      label: 'Annulé',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      icon: <XCircle className="w-3.5 h-3.5" />
    }
  };

  const current = configs[status] || configs.PENDING;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${current.bg} ${current.text} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
