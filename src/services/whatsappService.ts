export type WhatsAppTemplateType = 'BOOKING_CONFIRMATION' | 'DISPATCH_CONFIRMED' | 'DRIVER_APPROACHING' | 'RIDE_COMPLETED';

export interface WhatsAppNotification {
  id: string;
  recipientPhone: string;
  recipientName: string;
  reference: string;
  template: WhatsAppTemplateType;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  content: string;
  timestamp: string;
  waUrl: string;
}

export const whatsappService = {
  // Normaliser un numéro de téléphone de Martinique vers le format international WhatsApp E.164
  normalizeMartiniquePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\.\-\(\)]/g, '');

    // Format local 0696XXXXXX ou 0596XXXXXX
    if (cleaned.startsWith('0696') || cleaned.startsWith('0596')) {
      return `596${cleaned.substring(1)}`;
    }

    // Format 696XXXXXX ou 596XXXXXX
    if (cleaned.startsWith('696')) {
      return `596${cleaned}`;
    }

    // Format déjà international +596...
    if (cleaned.startsWith('+596')) {
      return cleaned.replace('+', '');
    }

    // Format métropole ou générique 06...
    if (cleaned.startsWith('06') || cleaned.startsWith('07')) {
      return `33${cleaned.substring(1)}`;
    }

    return cleaned.replace('+', '');
  },

  // Générer le message textuel selon le template médical
  generateMessage(
    template: WhatsAppTemplateType,
    params: {
      patientName?: string;
      reference?: string;
      bookingRef?: string;
      date?: string;
      pickupDate?: string;
      time?: string;
      pickupTime?: string;
      transportType?: string;
      pickup?: string;
      pickupAddress?: string;
      destination?: string;
      facilityName?: string;
      companyName?: string;
      driverName?: string;
      driverPhone?: string;
      vehiclePlate?: string;
      etaMinutes?: number | string;
      trackingUrl?: string;
    }
  ): string {
    const ref = params.reference || params.bookingRef || 'MT-972-8821';
    const patient = params.patientName || 'Patient';
    const date = params.date || params.pickupDate || 'Aujourd\'hui';
    const time = params.time || params.pickupTime || '08:30';
    const transport = params.transportType || 'VSL Conventionné';
    const pickup = params.pickup || params.pickupAddress || 'Domicile';
    const dest = params.destination || params.facilityName || 'CHU Pierre Zobda-Quitman';
    const trackingUrl = params.trackingUrl || `https://medictrans972.fr/suivi?ref=${ref}`;

    switch (template) {
      case 'BOOKING_CONFIRMATION':
        return `🚨 *Médic'Trans 972 — Confirmation de Réservation*\n\nBonjour *${patient}*,\nVotre demande de transport sanitaire a bien été prise en compte par la Régulation Martinique.\n\n📋 *Réf. dossier :* ${ref}\n📅 *Date :* ${date} à ${time}\n🚑 *Mode :* ${transport}\n📍 *Départ :* ${pickup}\n🏥 *Destination :* ${dest}\n\n✅ Prise en charge Tiers-Payant subrogatoire CPAM Martinique (100% ALD).\n\n📱 *Suivez l'attribution de votre véhicule en direct :*\n${trackingUrl}\n\n_Assistance Régulation 24/7 : 05 96 72 00 97_`;

      case 'DISPATCH_CONFIRMED':
        return `✅ *Médic'Trans 972 — Transporteur Attribué*\n\nBonjour *${patient}*,\nUn transporteur conventionné a verrouillé votre course *${ref}*.\n\n🚑 *Société :* ${params.companyName || 'Ambulances Caraïbes Express'}\n👨‍✈️ *Chauffeur :* ${params.driverName || 'Frantz M.'} (${params.driverPhone || '06 96 88 44 22'})\n🚘 *Véhicule :* ${params.vehiclePlate || 'GK-428-MQ'}\n\nLe bon de transport Cerfa a été télétransmis numériquement.\n\n📍 *Suivi GPS du véhicule :*\n${trackingUrl}`;

      case 'DRIVER_APPROACHING':
        return `⏱️ *Médic'Trans 972 — Équipage en Approche*\n\nBonjour *${patient}*,\nVotre équipage sanitaire est en route vers votre domicile.\n\n⏳ *Arrivée estimée :* dans ~${params.etaMinutes || 15} minutes\n📍 *Adresse :* ${pickup}\n📞 *Contact direct chauffeur :* ${params.driverPhone || '06 96 88 44 22'}\n\nMerci de préparer votre Carte Vitale et votre Prescription Médicale (PMT).`;

      case 'RIDE_COMPLETED':
        return `🏁 *Médic'Trans 972 — Fin de Prise en Charge*\n\nBonjour *${patient}*,\nVotre transport vers *${dest}* a été clôturé avec succès.\n\n📄 Votre bordereau de télétransmission BBD a été transmis à la CPAM Martinique pour dispense totale d'avance de frais.\n\n_Merci pour votre confiance avec le réseau sanitaire Médic'Trans 972._`;
    }
  },

  // Créer et enregistrer une notification WhatsApp
  notify(
    phone: string,
    patientName: string,
    reference: string,
    template: WhatsAppTemplateType,
    params: any
  ): WhatsAppNotification {
    const normPhone = this.normalizeMartiniquePhone(phone);
    const content = this.generateMessage(template, {
      ...params,
      patientName,
      reference,
    });

    const waUrl = `https://wa.me/${normPhone}?text=${encodeURIComponent(content)}`;

    const notification: WhatsAppNotification = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientPhone: phone,
      recipientName: patientName,
      reference,
      template,
      status: 'DELIVERED',
      content,
      timestamp: new Date().toISOString(),
      waUrl,
    };

    try {
      const history = this.getHistory();
      history.unshift(notification);
      localStorage.setItem('medictrans_whatsapp_notifications', JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('Could not save WhatsApp history:', e);
    }

    return notification;
  },

  // Récupérer l'historique des notifications
  getHistory(): WhatsAppNotification[] {
    try {
      const saved = localStorage.getItem('medictrans_whatsapp_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  // Ouvrir WhatsApp Web / Application directement
  openWhatsAppDirect(
    phone: string,
    textOrTemplate: string | WhatsAppTemplateType,
    params?: any
  ): void {
    const isTemplate = ['BOOKING_CONFIRMATION', 'DISPATCH_CONFIRMED', 'DRIVER_APPROACHING', 'RIDE_COMPLETED'].includes(textOrTemplate);
    const messageText = isTemplate
      ? this.generateMessage(textOrTemplate as WhatsAppTemplateType, params || {})
      : textOrTemplate;
    const normPhone = this.normalizeMartiniquePhone(phone);
    const url = `https://wa.me/${normPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};
