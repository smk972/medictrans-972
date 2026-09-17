// ==============================================================================
// Resend Client initialization for Supabase Edge Functions (Deno)
// ==============================================================================

import { Resend } from 'npm:resend@^4.1.2';

const resendApiKey = Deno.env.get('RESEND_API_KEY');

if (!resendApiKey) {
  console.warn('[Resend] Warning: RESEND_API_KEY environment variable is not set.');
}

export const resend = new Resend(resendApiKey || '');

export const DEFAULT_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Clinigo <bonjour@notifications.clinigo.fr>';
