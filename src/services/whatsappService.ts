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
  // Normaliser un numéro de téléphone (+33, +596, +590, +594, +262) vers le format international WhatsApp E.164
  normalizePhoneE164(phone: string): string {
    const raw = phone.trim();
    const cleaned = raw.replace(/[\s\.\-\(\)]/g, '');

    // Vérifier les préfixes explicites avec '+' ou '00'
    const supportedPrefixes = [
      { prefix: '+596', code: '596' },
      { prefix: '+590', code: '590' },
      { prefix: '+594', code: '594' },
      { prefix: '+262', code: '262' },
      { prefix: '+33', code: '33' },
      { prefix: '00596', code: '596' },
      { prefix: '00590', code: '590' },
      { prefix: '00594', code: '594' },
      { prefix: '00262', code: '262' },
      { prefix: '0033', code: '33' },
    ];

    for (const item of supportedPrefixes) {
      if (cleaned.startsWith(item.prefix)) {
        let remainder = cleaned.substring(item.prefix.length);
        if (remainder.startsWith('0')) {
          remainder = remainder.substring(1);
        }
        return `${item.code}${remainder}`;
      }
    }

    // Détection automatique selon préfixes nationaux (0696, 0690, 0694, 0692/0693, 06/07)
    if (cleaned.startsWith('0696') || cleaned.startsWith('0596')) {
      return `596${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('0690') || cleaned.startsWith('0590')) {
      return `590${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('0694') || cleaned.startsWith('0594')) {
      return `594${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('0692') || cleaned.startsWith('0693') || cleaned.startsWith('0262')) {
      return `262${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('06') || cleaned.startsWith('07') || cleaned.startsWith('01') || cleaned.startsWith('02') || cleaned.startsWith('03') || cleaned.startsWith('04') || cleaned.startsWith('05')) {
      return `33${cleaned.substring(1)}`;
    }

    // Format déjà sans indicatif ou avec indicatif direct sans '+'
    return cleaned.replace('+', '');
  },

  // Alias pour rétrocompatibilité
  normalizeMartiniquePhone(phone: string): string {
    return this.normalizePhoneE164(phone);
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
        return `🚨 *Clinigo — Confirmation de Réservation*\n\nBonjour *${patient}*,\nVotre demande de transport sanitaire a bien été prise en compte par la Régulation Clinigo.\n\n📋 *Réf. dossier :* ${ref}\n📅 *Date :* ${date} à ${time}\n🚑 *Mode :* ${transport}\n📍 *Départ :* ${pickup}\n🏥 *Destination :* ${dest}\n\n✅ Prise en charge Tiers-Payant subrogatoire CPAM (100% ALD).\n\n📱 *Suivez l'attribution de votre véhicule en direct :*\n${trackingUrl}\n\n_Assistance Régulation Clinigo 24/7 : 05 96 72 00 97_`;

      case 'DISPATCH_CONFIRMED':
        return `✅ *Clinigo — Transporteur Attribué*\n\nBonjour *${patient}*,\nUn transporteur conventionné a verrouillé votre course *${ref}*.\n\n🚑 *Société :* ${params.companyName || 'Ambulances Caraïbes Express'}\n👨‍✈️ *Chauffeur :* ${params.driverName || 'Frantz M.'} (${params.driverPhone || '06 96 88 44 22'})\n🚘 *Véhicule :* ${params.vehiclePlate || 'GK-428-MQ'}\n\nLe bon de transport Cerfa a été télétransmis numériquement.\n\n📍 *Suivi GPS du véhicule :*\n${trackingUrl}`;

      case 'DRIVER_APPROACHING':
        return `⏱️ *Clinigo — Équipage en Approche*\n\nBonjour *${patient}*,\nVotre équipage sanitaire est en route vers votre domicile.\n\n⏳ *Arrivée estimée :* dans ~${params.etaMinutes || 15} minutes\n📍 *Adresse :* ${pickup}\n📞 *Contact direct chauffeur :* ${params.driverPhone || '06 96 88 44 22'}\n\nMerci de préparer votre Carte Vitale et votre Prescription Médicale (PMT).`;

      case 'RIDE_COMPLETED':
        return `🏁 *Clinigo — Fin de Prise en Charge*\n\nBonjour *${patient}*,\nVotre transport vers *${dest}* a été clôturé avec succès.\n\n📄 Votre bordereau de télétransmission BBD a été transmis à la CPAM pour dispense totale d'avance de frais.\n\n_Merci pour votre confiance avec le réseau Clinigo._`;
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
