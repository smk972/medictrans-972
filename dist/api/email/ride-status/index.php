<?php
// ==============================================================================
// Clinigo - API PHP pour l'envoi d'e-mails de statut de course via Resend
// Gère tous les états : ACCEPTED, EN_ROUTE, PICKED_UP, COMPLETED, CANCELLED
// Compatible hébergement Apache / Plesk & VPS IONOS
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
$status = isset($data['status']) && !empty($data['status']) ? strtoupper(trim($data['status'])) : 'ACCEPTED';
$transporterName = isset($data['transporterName']) && !empty($data['transporterName']) ? trim($data['transporterName']) : 'Ambulances Agréées Clinigo';
$driverName = isset($data['driverName']) && !empty($data['driverName']) ? trim($data['driverName']) : 'Chauffeur Régulé';
$driverPhone = isset($data['driverPhone']) && !empty($data['driverPhone']) ? trim($data['driverPhone']) : '';
$vehiclePlate = isset($data['vehiclePlate']) && !empty($data['vehiclePlate']) ? trim($data['vehiclePlate']) : 'Véhicule Conventionné';
$pickupAddress = isset($data['pickupAddress']) && !empty($data['pickupAddress']) ? trim($data['pickupAddress']) : 'Votre adresse';
$dropoffAddress = isset($data['dropoffAddress']) && !empty($data['dropoffAddress']) ? trim($data['dropoffAddress']) : 'Établissement de soins';
$pickupDate = isset($data['pickupDate']) && !empty($data['pickupDate']) ? trim($data['pickupDate']) : 'Aujourd’hui';
$pickupTime = isset($data['pickupTime']) && !empty($data['pickupTime']) ? trim($data['pickupTime']) : '08:30';
$etaMinutes = isset($data['etaMinutes']) ? trim($data['etaMinutes']) : '';
$trackingUrl = isset($data['trackingUrl']) && !empty($data['trackingUrl']) ? trim($data['trackingUrl']) : ('https://clinigo.fr/confirmation/' . urlencode($reference));

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Adresse email valide requise']);
    exit;
}

$fallbackKey = base64_decode('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v');
$apiKey = getenv('RESEND_API_KEY') ?: $fallbackKey;
$fromEmail = getenv('RESEND_FROM_EMAIL') ?: 'Clinigo <bonjour@notifications.clinigo.fr>';

// Configuration thématique selon le statut de la course
switch ($status) {
    case 'PENDING':
        $badgeText = 'Enregistrée • Recherche de transporteur';
        $badgeBg = '#0284C7';
        $badgeColor = '#FFFFFF';
        $headerGradient = 'linear-gradient(135deg, #002D52 0%, #0284C7 100%)';
        $headerTitle = 'Demande de transport enregistrée';
        $headerSubtitle = 'Dossier N° #' . htmlspecialchars($reference, ENT_QUOTES, 'UTF-8');
        $subject = 'Clinigo — Confirmation de votre demande de transport #' . $reference;
        $statusDesc = 'Nous vous confirmons la bonne prise en compte de votre demande de transport médicalisé N° <strong>#' . htmlspecialchars($reference, ENT_QUOTES, 'UTF-8') . '</strong>.<br><br>Votre dossier est en cours de diffusion auprès des transporteurs sanitaires conventionnés (ambulances et taxis conventionnés agréés CPAM / CGSS) de votre secteur.';
        break;

    case 'EN_ROUTE':
        $badgeText = 'Chauffeur en route';
        $badgeBg = '#1D4ED8';
        $badgeColor = '#FFFFFF';
        $headerGradient = 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)';
        $headerTitle = 'Votre chauffeur est en route';
        $headerSubtitle = 'Arrivée estimée' . ($etaMinutes ? ' : dans environ ' . htmlspecialchars($etaMinutes, ENT_QUOTES, 'UTF-8') . ' min' : ' sous peu');
        $subject = 'Clinigo — Votre chauffeur est en route #' . $reference;
        $statusDesc = 'Votre chauffeur <strong>' . htmlspecialchars($driverName, ENT_QUOTES, 'UTF-8') . '</strong> est actuellement en route vers votre point de prise en charge avec le véhicule immatriculé <strong>' . htmlspecialchars($vehiclePlate, ENT_QUOTES, 'UTF-8') . '</strong>.';
        break;

    case 'PICKED_UP':
        $badgeText = 'Patient à bord • Trajet en cours';
        $badgeBg = '#0D9488';
        $badgeColor = '#FFFFFF';
        $headerGradient = 'linear-gradient(135deg, #115E59 0%, #0F766E 100%)';
        $headerTitle = 'Prise en charge effectuée';
        $headerSubtitle = 'En route vers votre établissement de soins';
        $subject = 'Clinigo — Prise en charge effectuée #' . $reference;
        $statusDesc = 'Vous êtes bien pris(e) en charge par <strong>' . htmlspecialchars($transporterName, ENT_QUOTES, 'UTF-8') . '</strong>. Votre trajet se poursuit en toute sécurité vers votre destination.';
        break;

    case 'COMPLETED':
        $badgeText = 'Transport terminé • Arrivé à destination';
        $badgeBg = '#059669';
        $badgeColor = '#FFFFFF';
        $headerGradient = 'linear-gradient(135deg, #065F46 0%, #047857 100%)';
        $headerTitle = 'Vous êtes bien arrivé(e)';
        $headerSubtitle = 'Mission accomplie avec succès';
        $subject = 'Clinigo — Transport médicalisé terminé #' . $reference;
        $statusDesc = 'Votre transport médicalisé avec <strong>' . htmlspecialchars($transporterName, ENT_QUOTES, 'UTF-8') . '</strong> est maintenant achevé. Toute l\'équipe Clinigo espère que votre trajet s\'est déroulé dans d\'excellentes conditions.';
        break;

    case 'CANCELLED':
        $badgeText = 'Demande de transport annulée';
        $badgeBg = '#DC2626';
        $badgeColor = '#FFFFFF';
        $headerGradient = 'linear-gradient(135deg, #991B1B 0%, #B91C1C 100%)';
        $headerTitle = 'Course Annulée';
        $headerSubtitle = 'Demande N° #' . htmlspecialchars($reference, ENT_QUOTES, 'UTF-8');
        $subject = 'Clinigo — Demande de transport annulée #' . $reference;
        $statusDesc = 'Votre demande de transport médicalisé #' . htmlspecialchars($reference, ENT_QUOTES, 'UTF-8') . ' a été annulée. Si vous avez besoin d\'un nouveau trajet, vous pouvez planifier une nouvelle réservation à tout moment sur Clinigo.';
        break;

    case 'ACCEPTED':
    default:
        $badgeText = 'Course Acceptée & Validée';
        $badgeBg = 'rgba(255,255,255,0.15)';
        $badgeColor = '#A7F3D0';
        $headerGradient = 'linear-gradient(135deg, #002D52 0%, #004479 100%)';
        $headerTitle = 'Votre transporteur est confirmé';
        $headerSubtitle = 'Demande N° #' . htmlspecialchars($reference, ENT_QUOTES, 'UTF-8');
        $subject = 'Clinigo — Transporteur confirmé #' . $reference . ' - ' . $transporterName;
        $statusDesc = 'Bonne nouvelle ! Votre transport médicalisé a été pris en charge par <strong>' . htmlspecialchars($transporterName, ENT_QUOTES, 'UTF-8') . '</strong>.';
        break;
}

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
  <title>' . htmlspecialchars($subject, ENT_QUOTES, 'UTF-8') . '</title>
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
    ' . strip_tags($statusDesc) . ' Demande #' . $safeRef . '.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 32px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden; text-align: left;">
          
          <!-- En-tête dynamique avec dégradé -->
          <tr>
            <td align="center" style="background: ' . $headerGradient . '; padding: 36px 28px; text-align: center;">
              <span style="display: inline-block; padding: 6px 14px; background: ' . $badgeBg . '; border-radius: 9999px; color: ' . $badgeColor . '; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
                ' . $badgeText . '
              </span>
              <h1 style="margin: 8px 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 24px; line-height: 30px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">
                ' . $headerTitle . '
              </h1>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; color: #BAE6FD; font-weight: 500;">
                ' . $headerSubtitle . '
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
                ' . $statusDesc . '
              </p>

              <!-- Carte du transporteur assigné si non annulé -->
              ' . ($status !== 'CANCELLED' ? '
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                      Transporteur Conventionné Assigné
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
              </table>' : '') . '

              <!-- Détails du trajet -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                      Rappel de la mission #' . $safeRef . '
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
              <p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #64748B; text-align: center;">
                Si le bouton ne s\'ouvre pas, vous pouvez cliquer directement sur ce lien ou le copier :<br>
                <a href="' . $safeTrackingUrl . '" target="_blank" rel="noopener noreferrer" style="color: #004479; font-weight: 600; word-break: break-all; text-decoration: underline;">' . $safeTrackingUrl . '</a>
              </p>
            </td>
          </tr>

          <!-- Pied de page avec mentions légales -->
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

// Version texte brut alternative indispensable pour la délivrabilité (évite le classement en spam)
$textContent = "Bonjour " . $patientName . ",\n\n"
    . strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $statusDesc)) . "\n\n"
    . "RÉCAPITULATIF DE LA MISSION #" . $reference . " :\n"
    . "- Date et heure : " . $pickupDate . " à " . $pickupTime . "\n"
    . "- Lieu de départ : " . $pickupAddress . "\n"
    . "- Destination : " . $dropoffAddress . "\n";

if ($status !== 'CANCELLED' && $status !== 'PENDING') {
    $textContent .= "- Transporteur : " . $transporterName . "\n"
        . "- Chauffeur : " . $driverName . ($driverPhone ? " (" . $driverPhone . ")" : "") . "\n"
        . "- Véhicule : " . $vehiclePlate . "\n";
}

$textContent .= "\nPour suivre votre prise en charge en temps réel, rendez-vous sur :\n"
    . $trackingUrl . "\n\n"
    . "Besoin d'aide ? Notre régulation est joignable au 05 96 72 00 97 ou par email à contact@clinigo.fr.\n"
    . "Clinigo - Plateforme de régulation du transport sanitaire";

$payload = json_encode([
    'from' => $fromEmail,
    'to' => [$email],
    'reply_to' => 'contact@clinigo.fr',
    'subject' => $subject,
    'html' => $htmlContent,
    'text' => $textContent,
    'headers' => [
        'X-Entity-Ref-ID' => $reference,
        'List-Unsubscribe' => '<mailto:contact@clinigo.fr?subject=unsubscribe>'
    ],
    'tags' => [
        ['name' => 'category', 'value' => 'ride_status_update'],
        ['name' => 'status', 'value' => strtolower($status)],
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
        'status' => $status,
        'reference' => $reference
    ]);
} else {
    http_response_code($httpCode ?: 502);
    echo json_encode([
        'error' => $result['message'] ?? 'Erreur lors de l\'envoi via Resend',
        'details' => $result
    ]);
}
