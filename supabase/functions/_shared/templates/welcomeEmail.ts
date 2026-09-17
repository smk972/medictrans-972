// ==============================================================================
// Clinigo - Welcome Email Template (HTML Responsive for Email Clients)
// ==============================================================================

export interface WelcomeEmailData {
  firstName: string;
  lastName?: string;
  email: string;
  loginUrl?: string;
  contactUrl?: string;
}

export function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const firstName = (data.firstName || 'Bienvenue').trim();
  const loginUrl = data.loginUrl || 'https://clinigo.fr/connexion';
  const contactUrl = data.contactUrl || 'https://clinigo.fr/#contact';

  return `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bienvenue sur Clinigo 👋</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F5F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .email-content { padding: 32px 20px !important; }
      .feature-col { display: block !important; width: 100% !important; margin-bottom: 14px !important; }
      .feature-col:last-child { margin-bottom: 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F7FA; -webkit-font-smoothing: antialiased;">
  <!-- Preheader preview text (hidden in body) -->
  <div style="display: none; font-size: 1px; color: #F5F7FA; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Votre compte Clinigo a bien été créé. Organisez vos transports sanitaires en toute tranquillité.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F5F7FA; padding: 36px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container 600px -->
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E5E7EB; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden; text-align: left;">
          
          <!-- Header: Official Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px 40px; border-bottom: 1px solid #F3F4F6;">
              <a href="https://clinigo.fr" target="_blank" style="text-decoration: none;">
                <img src="https://clinigo.fr/assets/clinigo-logo.png" alt="Clinigo" width="148" style="display: block; width: 148px; max-width: 148px; height: auto; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="email-content" style="padding: 40px 48px;">

              <!-- Main Greeting -->
              <h1 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 26px; line-height: 32px; font-weight: 800; color: #111827; text-align: center; letter-spacing: -0.02em;">
                Bonjour ${firstName} 👋
              </h1>

              <div style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; line-height: 24px; font-weight: 600; color: #2563EB; text-align: center;">
                Bienvenue sur Clinigo.
              </div>

              <p style="margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 24px; color: #4B5563; text-align: center;">
                Votre compte a bien été créé.<br />
                Vous pouvez maintenant utiliser Clinigo pour organiser vos transports sanitaires simplement et en toute tranquillité.
              </p>

              <!-- Primary CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 36px auto;">
                <tr>
                  <td align="center" bgcolor="#2563EB" style="border-radius: 12px; background-color: #2563EB; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; letter-spacing: 0.03em;">
                      ACCÉDER À MON COMPTE
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Informative Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0F7FF; border: 1px solid #DBEAFE; border-radius: 14px; margin-bottom: 36px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #1E40AF; padding-bottom: 6px;">
                          🚑 Votre espace Clinigo
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 20px; color: #3B82F6;">
                          Depuis votre espace personnel, vous pourrez demander un transport, consulter vos réservations et suivre vos courses en temps réel.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 3 Feature Columns (Responsive table) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <!-- Feature 1 -->
                  <td class="feature-col" width="31%" valign="top" style="padding: 16px; background-color: #FAFAFA; border: 1px solid #F3F4F6; border-radius: 14px;">
                    <div style="font-size: 20px; line-height: 1; margin-bottom: 8px;">📅</div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                      Réserver
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #6B7280;">
                      Organisez votre transport sanitaire simplement.
                    </div>
                  </td>
                  <td width="3%" style="font-size: 1px;">&nbsp;</td>
                  <!-- Feature 2 -->
                  <td class="feature-col" width="31%" valign="top" style="padding: 16px; background-color: #FAFAFA; border: 1px solid #F3F4F6; border-radius: 14px;">
                    <div style="font-size: 20px; line-height: 1; margin-bottom: 8px;">🚑</div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                      Suivre
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #6B7280;">
                      Suivez l'arrivée de votre transporteur en temps réel.
                    </div>
                  </td>
                  <td width="3%" style="font-size: 1px;">&nbsp;</td>
                  <!-- Feature 3 -->
                  <td class="feature-col" width="31%" valign="top" style="padding: 16px; background-color: #FAFAFA; border: 1px solid #F3F4F6; border-radius: 14px;">
                    <div style="font-size: 20px; line-height: 1; margin-bottom: 8px;">🔔</div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                      Être informé
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #6B7280;">
                      Recevez les informations importantes concernant vos courses.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Light Divider -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="border-top: 1px solid #E5E7EB; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Support Section -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center;">
                <tr>
                  <td align="center">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                      Besoin d'aide ?
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 20px; color: #6B7280; margin-bottom: 8px;">
                      Notre équipe Clinigo est disponible pour répondre à vos questions.
                    </div>
                    <a href="${contactUrl}" target="_blank" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; color: #2563EB; text-decoration: none;">
                      Contacter Clinigo &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; border-top: 1px solid #F3F4F6; padding: 32px 24px; text-align: center;">
              <!-- Small Logo -->
              <div style="margin-bottom: 12px;">
                <img src="https://clinigo.fr/assets/clinigo-logo.png" alt="Clinigo" width="90" style="display: inline-block; width: 90px; opacity: 0.7;" />
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 500; color: #6B7280; margin-bottom: 8px;">
                Le transport sanitaire simplifié.
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #9CA3AF; margin-bottom: 8px;">
                <a href="https://clinigo.fr" target="_blank" style="color: #9CA3AF; text-decoration: none;">Clinigo.fr</a> · 
                <a href="${contactUrl}" target="_blank" style="color: #9CA3AF; text-decoration: none;">Contact</a> · 
                <a href="https://clinigo.fr/confidentialite" target="_blank" style="color: #9CA3AF; text-decoration: none;">Confidentialité</a>
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #9CA3AF;">
                &copy; 2026 Clinigo. Tous droits réservés.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
