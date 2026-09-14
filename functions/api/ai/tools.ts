/**
 * Interfaces des outils et fonctions contrôlées (Function Calling)
 * Conçues pour permettre ultérieurement la connexion sécurisée à la base de données
 * (courses, transporteurs, établissements) sans jamais donner d'accès direct SQL à l'IA.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'checkRideStatus',
    description: 'Consulte le statut en temps réel d\'une course ou réservation médicale à partir de son numéro de référence (ex: MT-972-XXXX).',
    parameters: {
      type: 'object',
      properties: {
        reference: {
          type: 'string',
          description: 'La référence unique du dossier de transport (ex: MT-972-1234).'
        }
      },
      required: ['reference']
    }
  },
  {
    name: 'getTransportersByCommune',
    description: 'Liste les transporteurs sanitaires conventionnés ARS intervenant dans une commune de Martinique.',
    parameters: {
      type: 'object',
      properties: {
        commune: {
          type: 'string',
          description: 'Le nom de la commune en Martinique (ex: Fort-de-France, Le Lamentin, Le Marin, Trinité).'
        },
        mode: {
          type: 'string',
          description: 'Le type de transport souhaité',
          enum: ['TAXI', 'VSL', 'AMBULANCE']
        }
      },
      required: ['commune']
    }
  },
  {
    name: 'searchFaqAndRules',
    description: 'Effectue une recherche sémantique dans la documentation officielle et la réglementation CPAM Martinique.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'La question ou le mot-clé de recherche juridique/médico-administrative.'
        }
      },
      required: ['query']
    }
  }
];

/**
 * Exécuteur contrôlé (Sandbox sécurisée)
 * Implémentation type mock / extension future vers Supabase
 */
export async function executeToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'checkRideStatus':
      if (!args.reference || typeof args.reference !== 'string') {
        return { error: 'Référence invalide ou manquante.' };
      }
      return {
        reference: args.reference.toUpperCase(),
        found: true,
        message: `Dossier ${args.reference.toUpperCase()} en cours de traitement par la régulation Médic'Trans 972.`,
        consultUrl: `/suivi`
      };

    case 'getTransportersByCommune':
      return {
        commune: args.commune,
        mode: args.mode || 'TOUS',
        countAvailable: 12,
        notice: 'Réseau de 85+ transporteurs sanitaires conventionnés répartis sur les 34 communes de Martinique.'
      };

    case 'searchFaqAndRules':
      return {
        query: args.query,
        source: 'Guide Conventionnel ARS & CPAM Martinique 2026',
        result: 'Prise en charge soumise à Prescription Médicale de Transport Cerfa S3138 préalable.'
      };

    default:
      return { error: `Outil inconnu : ${name}` };
  }
}
