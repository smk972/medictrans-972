// ==============================================================================
// Supabase Edge Function: send-password-reset-email
// Runtime: Deno
// Trigger: Direct HTTP call via supabase.functions.invoke
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';
import { resend } from '../_shared/resend.ts';

interface RequestBody {
  email: string;
  resetUrl: string;
  resetCode?: string;
  firstName?: string;
}

const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Clinigo <securite@notifications.clinigo.fr>';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { email, resetUrl, resetCode, firstName } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = (firstName || 'Bonjour').trim();
    const cleanUrl = resetUrl || 'https://clinigo.fr/connexion';

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 20px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#0F766E 0%,#115E59 100%);color:#FFFFFF;">
              <div style="display:inline-block;padding:10px 16px;background:rgba(255,255,255,0.15);border-radius:12px;margin-bottom:12px;">
                <span style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#FFFFFF;">CLINIGO</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;">Réinitialisation de votre mot de passe</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Sécurisation de vos accès santé</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;line-height:24px;margin:0 0 16px;">Bonjour <strong>${cleanFirstName}</strong>,</p>
              <p style="font-size:14px;line-height:22px;color:#475569;margin:0 0 24px;">
                Une demande de réinitialisation de mot de passe a été effectuée pour votre compte <strong>${cleanEmail}</strong>.
              </p>
              
              <div style="text-align:center;margin:32px 0;">
                <a href="${cleanUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0F766E 0%,#0D9488 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(15,118,110,0.3);">
                  👉 Définir un nouveau mot de passe
                </a>
              </div>

              ${resetCode ? `
              <div style="margin:24px 0;padding:16px;background-color:#F0FDFA;border:1px dashed #0D9488;border-radius:12px;text-align:center;">
                <span style="display:block;font-size:11px;font-weight:700;color:#0F766E;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Votre code de sécurité à 6 chiffres</span>
                <span style="font-size:26px;font-weight:900;letter-spacing:4px;color:#0F766E;font-family:monospace;">${resetCode}</span>
              </div>
              ` : ''}

              <p style="font-size:12px;line-height:18px;color:#64748B;margin:24px 0 0;">
                Ce lien et ce code sont valables pendant <strong>60 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute tranquillité, votre compte reste parfaitement protégé.
              </p>
              
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
              
              <p style="font-size:11px;color:#94A3B8;margin:0;word-break:break-all;">
                Lien direct : <a href="${cleanUrl}" style="color:#0F766E;">${cleanUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:11px;color:#94A3B8;">
              Clinigo — Plateforme Régulée de Transport Sanitaire • France &amp; Outre-Mer
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    console.log(`[send-password-reset-email] Sending to: ${cleanEmail} from: ${FROM_EMAIL}`);
    const sendResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [cleanEmail],
      subject: 'Clinigo — Réinitialisation de votre mot de passe 🔒',
      html: htmlContent,
      tags: [
        { name: 'category', value: 'password_reset' },
        { name: 'app', value: 'clinigo' },
      ],
    });

    if (sendResult.error) {
      console.error('[send-password-reset-email] Resend API error:', sendResult.error);
      return new Response(
        JSON.stringify({
          error: sendResult.error.message || 'Failed to send email via Resend',
          details: sendResult.error,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendId = sendResult.data?.id;
    console.log(`[send-password-reset-email] Sent successfully! Resend ID: ${resendId}`);

    return new Response(
      JSON.stringify({
        success: true,
        resendId,
        recipient: cleanEmail,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-password-reset-email] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
