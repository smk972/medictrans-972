<?php
// ==============================================================================
// Clinigo - API PHP pour l'envoi d'e-mail 'Course Acceptée' via Resend
// Compatible hébergement statique & Apache / Plesk
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée. Utilisez POST.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Corps JSON invalide']);
    exit;
}

$email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
$patientName = isset($data['patientName']) && !empty($data['patientName']) ? trim($data['patientName']) : 'Cher patient';
$reference = isset($data['reference']) && !empty($data['reference']) ? trim($data['reference']) : 'MT-972';
$transporterName = isset($data['transporterName']) && !empty($data['transporterName']) ? trim($data['transporterName']) : 'Ambulances Agréées Clinigo';
$driverName = isset($data['driverName']) && !empty($data['driverName']) ? trim($data['driverName']) : 'Chauffeur Régulé';
$driverPhone = isset($data['driverPhone']) && !empty($data['driverPhone']) ? trim($data['driverPhone']) : '';
$vehiclePlate = isset($data['vehiclePlate']) && !empty($data['vehiclePlate']) ? trim($data['vehiclePlate']) : 'Véhicule Conventionné';
$pickupAddress = isset($data['pickupAddress']) && !empty($data['pickupAddress']) ? trim($data['pickupAddress']) : 'Votre adresse';
$dropoffAddress = isset($data['dropoffAddress']) && !empty($data['dropoffAddress']) ? trim($data['dropoffAddress']) : 'Établissement de soins';
$pickupDate = isset($data['pickupDate']) && !empty($data['pickupDate']) ? trim($data['pickupDate']) : 'Aujourd’hui';
$pickupTime = isset($data['pickupTime']) && !empty($data['pickupTime']) ? trim($data['pickupTime']) : '08:30';
$trackingUrl = isset($data['trackingUrl']) && !empty($data['trackingUrl']) ? trim($data['trackingUrl']) : ('https://clinigo.fr/confirmation/' . urlencode($reference));

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Adresse email valide requise']);
    exit;
}

$fallbackKey = base64_decode('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v');
$apiKey = getenv('RESEND_API_KEY') ?: $fallbackKey;
$fromEmail = getenv('RESEND_FROM_EMAIL') ?: 'Clinigo <bonjour@notifications.clinigo.fr>';

$safePatientName = htmlspecialchars($patientName, ENT_QUOTES, 'UTF-8');
$safeRef = htmlspecialchars($reference, ENT_QUOTES, 'UTF-8');
$safeTransporter = htmlspecialchars($transporterName, ENT_QUOTES, 'UTF-8');
$safeDriver = htmlspecialchars($driverName, ENT_QUOTES, 'UTF-8');
$safeDriverPhone = htmlspecialchars($driverPhone, ENT_QUOTES, 'UTF-8');
$safePlate = htmlspecialchars($vehiclePlate, ENT_QUOTES, 'UTF-8');
$safePickup = htmlspecialchars($pickupAddress, ENT_QUOTES, 'UTF-8');
$safeDropoff = htmlspecialchars($dropoffAddress, ENT_QUOTES, 'UTF-8');
$safeDate = htmlspecialchars($pickupDate, ENT_QUOTES, 'UTF-8');
$safeTime = htmlspecialchars($pickupTime, ENT_QUOTES, 'UTF-8');
$safeTrackingUrl = htmlspecialchars($trackingUrl, ENT_QUOTES, 'UTF-8');

$htmlContent = '<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transport Confirmé #' . $safeRef . '</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .email-content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #F8FAFC; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Bonne nouvelle ! Votre transport médicalisé #' . $safeRef . ' a été validé et pris en charge par ' . $safeTransporter . '.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 32px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden; text-align: left;">
          
          <!-- En-tête avec gradient Clinigo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #002D52 0%, #004479 100%); padding: 36px 28px; text-align: center;">
              <span style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.15); border-radius: 9999px; color: #A7F3D0; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
                ✓ Course Acceptée &amp; Validée
              </span>
              <h1 style="margin: 8px 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 24px; line-height: 30px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">
                Votre transporteur est confirmé
              </h1>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; color: #BAE6FD; font-weight: 500;">
                Demande N° <strong>#' . $safeRef . '</strong>
              </p>
            </td>
          </tr>

          <!-- Contenu du message -->
          <tr>
            <td class="email-content" style="padding: 36px 36px 24px 36px;">
              <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 15px; line-height: 24px; color: #334155;">
                Bonjour <strong>' . $safePatientName . '</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 15px; line-height: 24px; color: #334155;">
                Bonne nouvelle ! Votre transport médicalisé a été pris en charge par <strong>' . $safeTransporter . '</strong>. Voici les détails de votre course :
              </p>

              <!-- Carte du transporteur assigné -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                      Transporteur Conventionné Agréé
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 18px; font-weight: 800; color: #14532D; margin-bottom: 8px;">
                      ' . $safeTransporter . '
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; line-height: 22px; color: #166534;">
                      👨‍✈️ <strong>Chauffeur :</strong> ' . $safeDriver . ($safeDriverPhone ? ' • Tél : <a href="tel:' . $safeDriverPhone . '" style="color: #15803D; font-weight: 700; text-decoration: none;">' . $safeDriverPhone . '</a>' : '') . '<br>
                      🚗 <strong>Véhicule :</strong> <span style="font-family: monospace; background-color: #DCFCE7; padding: 2px 6px; border-radius: 6px; font-weight: 700;">' . $safePlate . '</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Détails du trajet -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                      Détails de la mission
                    </div>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28" valign="top" style="font-size: 18px; line-height: 20px;">📅</td>
                        <td style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; color: #334155; padding-bottom: 12px;">
                          <strong>Date :</strong> ' . $safeDate . ' à <strong>' . $safeTime . '</strong>
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="font-size: 18px; line-height: 20px;">📍</td>
                        <td style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; color: #334155; padding-bottom: 12px;">
                          <strong>Prise en charge :</strong> ' . $safePickup . '
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="font-size: 18px; line-height: 20px;">🏥</td>
                        <td style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; color: #334155;">
                          <strong>Destination :</strong> ' . $safeDropoff . '
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bouton d\'accès au suivi en direct -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center" bgcolor="#004479" style="border-radius: 12px; background-color: #004479; box-shadow: 0 4px 12px rgba(0, 68, 121, 0.25);">
                    <a href="' . $safeTrackingUrl . '" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 15px 32px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; letter-spacing: 0.02em;">
                      Accéder au suivi en direct &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Lien de secours en texte brut pour garantir l\'accès sur tous les clients mails -->
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #64748B; text-align: center;">
                Si le bouton ne s\'ouvre pas, vous pouvez cliquer directement sur ce lien ou le copier :<br>
                <a href="' . $safeTrackingUrl . '" target="_blank" rel="noopener noreferrer" style="color: #004479; font-weight: 600; word-break: break-all; text-decoration: underline;">' . $safeTrackingUrl . '</a>
              </p>

              <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 13px; line-height: 20px; color: #64748B; text-align: center;">
                Pensez à préparer votre Prescription Médicale de Transport (PMT Cerfa) et votre Carte Vitale pour le chauffeur.
              </p>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; border-top: 1px solid #F1F5F9; padding: 24px; text-align: center;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px;">
                Clinigo • Plateforme de Régulation du Transport Sanitaire Conventionné
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11px; color: #64748B; margin-bottom: 6px;">
                Assistance Régulation 24/7 : 05 96 72 00 97 • Email : contact@clinigo.fr
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11px; color: #94A3B8;">
                Vous recevez ce courriel car une demande de transport a été initiée sur Clinigo.fr.<br>
                &copy; ' . date('Y') . ' Clinigo. Tous droits réservés.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

$textContent = "Bonjour " . $patientName . ",\n\n"
    . "Bonne nouvelle ! Votre transport médicalisé #" . $reference . " a été validé et pris en charge par " . $transporterName . ".\n\n"
    . "DÉTAILS DE VOTRE PRISE EN CHARGE :\n"
    . "- Chauffeur : " . $driverName . ($driverPhone ? " (" . $driverPhone . ")" : "") . "\n"
    . "- Véhicule conventionné : " . $vehiclePlate . "\n"
    . "- Date et heure : " . $pickupDate . " à " . $pickupTime . "\n"
    . "- Départ : " . $pickupAddress . "\n"
    . "- Destination : " . $dropoffAddress . "\n\n"
    . "Pour suivre l'arrivée de votre chauffeur en direct, rendez-vous sur :\n"
    . $trackingUrl . "\n\n"
    . "Rappel : Préparez votre Prescription Médicale de Transport (Cerfa S3138) et votre attestation de droits pour le chauffeur.\n"
    . "Assistance Régulation Clinigo : 05 96 72 00 97.\n"
    . "Clinigo - Plateforme de régulation sanitaire";

$payload = json_encode([
    'from' => $fromEmail,
    'to' => [$email],
    'reply_to' => 'contact@clinigo.fr',
    'subject' => 'Clinigo — Transport médicalisé validé #' . $safeRef . ' - ' . $safeTransporter,
    'html' => $htmlContent,
    'text' => $textContent,
    'headers' => [
        'X-Entity-Ref-ID' => $reference,
        'List-Unsubscribe' => '<mailto:contact@clinigo.fr?subject=unsubscribe>'
    ],
    'tags' => [
        ['name' => 'category', 'value' => 'ride_accepted'],
        ['name' => 'reference', 'value' => $reference]
    ]
]);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
    'Content-Length: ' . strlen($payload)
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à Resend: ' . $curlError]);
    exit;
}

$result = json_decode($response, true);

if ($httpCode >= 200 && $httpCode < 300) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'resendId' => $result['id'] ?? null,
        'email' => $email,
        'reference' => $reference
    ]);
} else {
    http_response_code($httpCode ?: 502);
    echo json_encode([
        'error' => $result['message'] ?? 'Erreur lors de l\'envoi via Resend',
        'details' => $result
    ]);
}
