import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Ride, TransportType } from '../types';
import { Driver, VehicleFleet, TransporterTab } from '../pages/TransporterPortalPage';

export interface OperationalAlert {
  id: string;
  type: 'UNASSIGNED_RIDE' | 'EXPIRING_DOC' | 'PENDING_RIDE' | 'MAINTENANCE';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'info';
  timestamp: string;
  targetTab: TransporterTab;
  read: boolean;
}

interface TransporterNotificationCenterProps {
  rides: Ride[];
  drivers: Driver[];
  fleet: VehicleFleet[];
  onNavigateTab: (tab: TransporterTab) => void;
}

export const TransporterNotificationCenter: React.FC<TransporterNotificationCenterProps> = ({
  rides,
  drivers,
  fleet,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('clinigo_read_alerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [filter, setFilter] = useState<'all' | 'high' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calcul des alertes opérationnelles en temps réel
  const alerts = useMemo<OperationalAlert[]>(() => {
    const list: OperationalAlert[] = [];
    const now = new Date();
    const nowTime = now.getTime();
    const next24hTime = nowTime + 24 * 3600 * 1000;

    // 1. Courses dans les prochaines 24h sans chauffeur affecté
    for (const r of rides) {
      const pTime = r.pickupDateTime ? new Date(r.pickupDateTime).getTime() : 0;
      if (
        pTime >= nowTime &&
        pTime <= next24hTime &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED' &&
        !r.assignedDriverId &&
        !r.assignedTransporter?.driverName
      ) {
        const patientName = `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || 'Patient';
        const pickupStr = r.pickupDateTime
          ? new Date(r.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '';
        list.push({
          id: `unassigned-${r.id}`,
          type: 'UNASSIGNED_RIDE',
          title: `Course non affectée (${pickupStr})`,
          message: `${patientName} : ${r.pickupCity} → ${r.dropoffCity}. Aucun chauffeur affecté pour ce trajet dans les prochaines 24h.`,
          severity: 'high',
          timestamp: r.pickupDateTime || r.createdAt || new Date().toISOString(),
          targetTab: 'PLANNING',
          read: readAlertIds.has(`unassigned-${r.id}`),
        });
      }
    }

    // 2. Courses en attente de confirmation (Bourse / Directes)
    const pendingRides = rides.filter((r) => r.status === 'PENDING');
    if (pendingRides.length > 0) {
      list.push({
        id: `pending-rides-batch`,
        type: 'PENDING_RIDE',
        title: `${pendingRides.length} course(s) en attente`,
        message: `Vous avez ${pendingRides.length} demande(s) de transport en attente de prise en charge ou confirmation.`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        targetTab: 'DISPONIBLES',
        read: readAlertIds.has(`pending-rides-batch`),
      });
    }

    // 3. Échéance de contrôle technique des véhicules (dans les 30 jours ou dépassé)
    for (const v of fleet) {
      if (v.technicalInspectionDate) {
        const expiry = new Date(v.technicalInspectionDate).getTime();
        const diffDays = Math.round((expiry - nowTime) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          list.push({
            id: `ct-veh-${v.id}`,
            type: 'EXPIRING_DOC',
            title: diffDays < 0 ? `Contrôle technique EXPIRÉ (${v.plate})` : `Contrôle technique proche (${v.plate})`,
            message: `${v.name} (${v.plate}) : échéance le ${new Date(v.technicalInspectionDate).toLocaleDateString('fr-FR')}${diffDays < 0 ? ' (dépassé !)' : ` (dans ${diffDays} j)`}.`,
            severity: diffDays < 0 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            targetTab: 'FLOTTE',
            read: readAlertIds.has(`ct-veh-${v.id}`),
          });
        }
      }
    }

    // 4. Échéance des cartes professionnelles / certificats médicaux des chauffeurs
    for (const d of drivers) {
      if (d.medicalCertificateExpiry) {
        const expiry = new Date(d.medicalCertificateExpiry).getTime();
        const diffDays = Math.round((expiry - nowTime) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          list.push({
            id: `med-drv-${d.id}`,
            type: 'EXPIRING_DOC',
            title: diffDays < 0 ? `Visite médicale expirée (${d.firstName} ${d.lastName})` : `Visite médicale à renouveler`,
            message: `${d.firstName} ${d.lastName} : validité jusqu'au ${new Date(d.medicalCertificateExpiry).toLocaleDateString('fr-FR')}.`,
            severity: diffDays < 0 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            targetTab: 'FLOTTE',
            read: readAlertIds.has(`med-drv-${d.id}`),
          });
        }
      }
    }

    return list;
  }, [rides, drivers, fleet, readAlertIds]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const filteredAlerts = useMemo(() => {
    if (filter === 'unread') return alerts.filter((a) => !a.read);
    if (filter === 'high') return alerts.filter((a) => a.severity === 'high');
    return alerts;
  }, [alerts, filter]);

  const markAllAsRead = () => {
    const allIds = new Set(readAlertIds);
    alerts.forEach((a) => allIds.add(a.id));
    setReadAlertIds(allIds);
    try {
      localStorage.setItem('clinigo_read_alerts', JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const handleAlertClick = (alert: OperationalAlert) => {
    const updated = new Set(readAlertIds);
    updated.add(alert.id);
    setReadAlertIds(updated);
    try {
      localStorage.setItem('clinigo_read_alerts', JSON.stringify(Array.from(updated)));
    } catch {}
    setIsOpen(false);
    onNavigateTab(alert.targetTab);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Cloche Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-xs'
            : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
        title="Centre d'alertes & notifications opérationnelles"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Menu Déroulant des Notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fadeIn">
          {/* En-tête */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-xl">notifications_active</span>
              <span className="text-xs font-black uppercase tracking-wider">Alertes & Notifications</span>
            </div>
            {alerts.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-slate-300 hover:text-white font-semibold transition-colors"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Filtres rapides */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Toutes ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('high')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === 'high' ? 'bg-white text-rose-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Urgentes
            </button>
          </div>

          {/* Liste des alertes */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredAlerts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs px-4">
                <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">done_all</span>
                Aucune alerte opérationnelle en cours. Tous vos voyants sont au vert !
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 text-xs ${
                    !alert.read ? 'bg-teal-50/30' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm ${
                      alert.severity === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : alert.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {alert.severity === 'high'
                        ? 'error'
                        : alert.severity === 'medium'
                        ? 'warning'
                        : 'info'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-extrabold text-slate-900 truncate">{alert.title}</h4>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-teal-700 font-bold">
                      <span>Voir dans l'onglet {alert.targetTab}</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
