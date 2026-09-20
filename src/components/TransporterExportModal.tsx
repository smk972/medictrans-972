import React, { useState, useMemo } from 'react';
import { Ride, TransportType } from '../types';
import { Driver, VehicleFleet } from '../pages/TransporterPortalPage';

interface TransporterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rides: Ride[];
  drivers: Driver[];
  fleet: VehicleFleet[];
  transporterName: string;
}

export const TransporterExportModal: React.FC<TransporterExportModalProps> = ({
  isOpen,
  onClose,
  rides,
  drivers,
  fleet,
  transporterName,
}) => {
  // Période par défaut : début de mois actuel -> fin de mois actuel
  const defaultDates = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDriver, setSelectedDriver] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL');
  const [exportProfile, setExportProfile] = useState<'BILLING' | 'OPERATIONAL'>('BILLING');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtrage des courses
  const filteredRides = useMemo(() => {
    setErrorMsg(null);
    if (startDate && endDate && startDate > endDate) {
      setErrorMsg('La date de début doit être antérieure ou égale à la date de fin.');
      return [];
    }

    return rides.filter((r) => {
      const pDate = (r.pickupDateTime || r.createdAt || '').slice(0, 10);
      if (startDate && pDate < startDate) return false;
      if (endDate && pDate > endDate) return false;

      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
      if (selectedType !== 'ALL' && r.transportType !== selectedType) return false;

      if (selectedDriver !== 'ALL') {
        const driverName = r.assignedTransporter?.driverName || '';
        const driverId = r.assignedDriverId || '';
        if (driverId !== selectedDriver && !driverName.includes(selectedDriver)) return false;
      }

      if (selectedVehicle !== 'ALL') {
        const plate = r.assignedVehiclePlate || r.assignedTransporter?.vehiclePlate || '';
        if (plate !== selectedVehicle) return false;
      }

      return true;
    });
  }, [rides, startDate, endDate, selectedStatus, selectedType, selectedDriver, selectedVehicle]);

  if (!isOpen) return null;

  // Génération du CSV UTF-8 normalisé
  const handleDownloadCsv = () => {
    if (filteredRides.length === 0) {
      alert('Aucune course ne correspond aux critères sélectionnés.');
      return;
    }

    let headers: string[] = [];
    if (exportProfile === 'BILLING') {
      headers = [
        'Référence Course',
        'Date Prise en Charge',
        'Heure',
        'Type Transport',
        'Patient Nom Prénom',
        'NIR / Sécu',
        'ALD',
        'Prescripteur / Établissement',
        'Départ (Ville)',
        'Arrivée (Ville / Établissement)',
        'Statut',
        'Chauffeur',
        'Véhicule (Immat)',
        'Distance Estimée (km)',
        'Montant Estimé (€)'
      ];
    } else {
      headers = [
        'Référence Course',
        'Date Prise en Charge',
        'Heure',
        'Type Transport',
        'Patient Nom',
        'Patient Prénom',
        'Téléphone Patient',
        'Adresse Départ Complète',
        'Commune Départ',
        'Adresse Arrivée Complète',
        'Commune Arrivée',
        'Établissement',
        'Besoins Mobilité',
        'Statut',
        'Chauffeur',
        'Véhicule',
        'Distance Estimée (km)',
        'Notes Internes'
      ];
    }

    const rows = filteredRides.map((r) => {
      const dt = r.pickupDateTime ? new Date(r.pickupDateTime) : null;
      const dateStr = dt ? dt.toLocaleDateString('fr-FR') : '';
      const timeStr = dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
      const patientFullName = `${r.patient?.lastName || ''} ${r.patient?.firstName || ''}`.trim();
      const driverName = r.assignedTransporter?.driverName || r.assignedDriverId || 'Non affecté';
      const plate = r.assignedVehiclePlate || r.assignedTransporter?.vehiclePlate || 'Non affecté';
      const amount = r.pricing?.totalPrestation || '';

      if (exportProfile === 'BILLING') {
        return [
          r.reference || r.id,
          dateStr,
          timeStr,
          r.transportType,
          patientFullName,
          r.patient?.nir || '',
          r.patient?.isAld ? 'OUI' : 'NON',
          r.facilityName || r.patient?.pmtPrescriberDoctor || '',
          r.pickupCity || '',
          r.dropoffCity || r.facilityName || '',
          r.status,
          driverName,
          plate,
          r.estimatedDistanceKm ? String(r.estimatedDistanceKm).replace('.', ',') : '',
          amount ? String(amount).replace('.', ',') : ''
        ];
      } else {
        const mobilities = [];
        if (r.mobility?.wheelchair) mobilities.push('Fauteuil');
        if (r.mobility?.stretcher) mobilities.push('Brancard');
        if (r.mobility?.oxygen) mobilities.push('O2');

        return [
          r.reference || r.id,
          dateStr,
          timeStr,
          r.transportType,
          r.patient?.lastName || '',
          r.patient?.firstName || '',
          r.patient?.phone || '',
          r.pickupAddress || '',
          r.pickupCity || '',
          r.dropoffAddress || '',
          r.dropoffCity || '',
          r.facilityName || '',
          mobilities.join(' + ') || 'Autonome',
          r.status,
          driverName,
          plate,
          r.estimatedDistanceKm ? String(r.estimatedDistanceKm).replace('.', ',') : '',
          (r.mobility?.notes || '').replace(/[\r\n]+/g, ' ')
        ];
      }
    });

    // Encodage CSV avec séparateur point-virgule et BOM UTF-8 (\uFEFF)
    const csvContent =
      '\uFEFF' +
      [headers.map((h) => `"${h}"`).join(';'), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))].join(
        '\r\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTransporter = transporterName.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Clinigo_Export_${exportProfile}_${cleanTransporter}_${startDate}_au_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-teal-400 text-2xl">file_download</span>
            <div>
              <h2 className="text-lg font-black tracking-tight">Export des Courses &amp; Facturation</h2>
              <p className="text-xs text-slate-300">
                Générez un fichier normalisé pour votre logiciel comptable ou de télétransmission.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Corps avec filtres & aperçu */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Sélection du Profil d'Export */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setExportProfile('BILLING')}
              className={`flex-1 p-3.5 rounded-2xl border text-left transition-all ${
                exportProfile === 'BILLING'
                  ? 'border-teal-500 bg-teal-500/10 text-teal-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Export Facturation / CPAM</span>
                {exportProfile === 'BILLING' && <span className="material-symbols-outlined text-teal-600 text-sm">check_circle</span>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Optimisé pour les logiciels externes (Gestav, AmbuSoft, Logidis) avec NIR, ALD et montants.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setExportProfile('OPERATIONAL')}
              className={`flex-1 p-3.5 rounded-2xl border text-left transition-all ${
                exportProfile === 'OPERATIONAL'
                  ? 'border-teal-500 bg-teal-500/10 text-teal-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Export Opérationnel</span>
                {exportProfile === 'OPERATIONAL' && <span className="material-symbols-outlined text-teal-600 text-sm">check_circle</span>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Détail logistique complet avec adresses précises, téléphones et besoins de mobilité.
              </p>
            </button>
          </div>

          {/* Filtres de Période & Critères */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Statut</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="COMPLETED">Terminées uniquement</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="CONFIRMED">Confirmées</option>
                <option value="CANCELLED">Annulées</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Type de transport</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">Tous les véhicules</option>
                <option value="AMBULANCE">Ambulance</option>
                <option value="VSL">VSL</option>
                <option value="TAXI_CONVENTIONNE">Taxi Conventionné</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Compteur & Aperçu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Aperçu des données ({filteredRides.length} course{filteredRides.length > 1 ? 's' : ''} sélectionnée{filteredRides.length > 1 ? 's' : ''})
              </span>
              <span className="text-[11px] text-slate-500">
                Format d'exportation : CSV UTF-8 (Séparateur point-virgule)
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              {filteredRides.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucune course trouvée pour les filtres sélectionnés.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">Réf</th>
                      <th className="p-2.5 border-b border-slate-200">Date</th>
                      <th className="p-2.5 border-b border-slate-200">Patient</th>
                      <th className="p-2.5 border-b border-slate-200">Type</th>
                      <th className="p-2.5 border-b border-slate-200">Trajet</th>
                      <th className="p-2.5 border-b border-slate-200">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRides.slice(0, 15).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-[11px] font-bold text-slate-900">{r.reference}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          {r.pickupDateTime ? new Date(r.pickupDateTime).toLocaleDateString('fr-FR') : ''}
                        </td>
                        <td className="p-2.5 font-medium">{r.patient?.lastName} {r.patient?.firstName}</td>
                        <td className="p-2.5">{r.transportType}</td>
                        <td className="p-2.5 truncate max-w-xs">{r.pickupCity} → {r.dropoffCity}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {filteredRides.length > 15 && (
              <div className="text-[11px] text-slate-400 mt-1 italic text-right">
                Affichage des 15 premières lignes (toutes les {filteredRides.length} lignes seront exportées dans le fichier).
              </div>
            )}
          </div>
        </div>

        {/* Pied de page avec boutons d'action */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filteredRides.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Télécharger l'export ({filteredRides.length} courses)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
