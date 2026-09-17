// ==============================================================================
// Supabase Edge Function: send-welcome-email
// Runtime: Deno
// Trigger: Direct HTTP call, Database Webhook, or Auth Hook
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';
import { resend, DEFAULT_FROM_EMAIL } from '../_shared/resend.ts';
import { generateWelcomeEmailHtml, WelcomeEmailData } from '../_shared/templates/welcomeEmail.ts';

interface RequestBody {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  loginUrl?: string;
}

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Parse request payload
    const body: RequestBody = await req.json();
    const { email, firstName, lastName, userId, loginUrl } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = (firstName || '').trim();
    const cleanLastName = (lastName || '').trim();
    const recipientName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ') || undefined;

    // 3. Optional: Initialize Supabase Admin Client for Idempotency & Logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let supabaseAdmin = null;

    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }

    // 4. Idempotency Check: Don't send welcome email twice to the same user/email
    if (supabaseAdmin) {
      const { data: existingLogs } = await supabaseAdmin
        .from('email_logs')
        .select('id, resend_id, status')
        .eq('recipient_email', cleanEmail)
        .eq('email_type', 'welcome')
        .eq('status', 'sent')
        .limit(1);

      if (existingLogs && existingLogs.length > 0) {
        console.log(`[send-welcome-email] Already sent to ${cleanEmail}, skipping (idempotent).`);
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            message: 'Welcome email was already sent to this recipient',
            resendId: existingLogs[0].resend_id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Generate responsive HTML email
    const emailData: WelcomeEmailData = {
      firstName: cleanFirstName || 'Bienvenue',
      lastName: cleanLastName,
      email: cleanEmail,
      loginUrl: loginUrl || 'https://clinigo.fr/connexion',
      contactUrl: 'https://clinigo.fr/#contact',
    };

    const html = generateWelcomeEmailHtml(emailData);

    // 6. Send Email via Resend API
    console.log(`[send-welcome-email] Sending to: ${cleanEmail} from: ${DEFAULT_FROM_EMAIL}`);
    const sendResult = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [cleanEmail],
      subject: 'Bienvenue sur Clinigo 👋',
      html,
      tags: [
        { name: 'category', value: 'welcome_email' },
        { name: 'app', value: 'clinigo' },
      ],
    });

    if (sendResult.error) {
      console.error('[send-welcome-email] Resend API error:', sendResult.error);
      
      // Log failure in Supabase if available
      if (supabaseAdmin) {
        await supabaseAdmin.from('email_logs').insert({
          recipient_email: cleanEmail,
          recipient_name: recipientName,
          email_type: 'welcome',
          entity_id: userId || null,
          status: 'failed',
          error_message: sendResult.error.message || JSON.stringify(sendResult.error),
          metadata: { provider: 'resend', error: sendResult.error },
        });
      }

      return new Response(
        JSON.stringify({
          error: sendResult.error.message || 'Failed to send email via Resend',
          details: sendResult.error,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendId = sendResult.data?.id;
    console.log(`[send-welcome-email] Email sent successfully! Resend ID: ${resendId}`);

    // 7. Record success in email_logs table
    if (supabaseAdmin) {
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: cleanEmail,
        recipient_name: recipientName,
        email_type: 'welcome',
        entity_id: userId || null,
        resend_id: resendId,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          provider: 'resend',
          resend_id: resendId,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        resendId,
        recipient: cleanEmail,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-welcome-email] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
