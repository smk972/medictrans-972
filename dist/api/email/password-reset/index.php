<?php
// ==============================================================================
// Clinigo - API PHP pour l'envoi d'e-mail de réinitialisation via Resend
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
$resetUrl = isset($data['resetUrl']) && !empty($data['resetUrl']) ? $data['resetUrl'] : 'https://clinigo.fr/connexion';
$resetCode = isset($data['resetCode']) ? trim($data['resetCode']) : '';
$firstName = isset($data['firstName']) && !empty($data['firstName']) ? trim($data['firstName']) : 'Bonjour';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Adresse email valide requise']);
    exit;
}

$fallbackKey = base64_decode('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v');
$apiKey = getenv('RESEND_API_KEY') ?: $fallbackKey;
$fromEmail = getenv('RESEND_FROM_EMAIL') ?: 'Clinigo <securite@notifications.clinigo.fr>';

$htmlContent = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
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
              <p style="font-size:15px;line-height:24px;margin:0 0 16px;">Bonjour <strong>' . htmlspecialchars($firstName, ENT_QUOTES, 'UTF-8') . '</strong>,</p>
              <p style="font-size:14px;line-height:22px;color:#475569;margin:0 0 24px;">
                Une demande de réinitialisation de mot de passe a été effectuée pour votre compte <strong>' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</strong>.
              </p>
              
              <div style="text-align:center;margin:32px 0;">
                <a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0F766E 0%,#0D9488 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(15,118,110,0.3);">
                  👉 Définir un nouveau mot de passe
                </a>
              </div>';

if (!empty($resetCode)) {
    $htmlContent .= '
              <div style="margin:24px 0;padding:16px;background-color:#F0FDFA;border:1px dashed #0D9488;border-radius:12px;text-align:center;">
                <span style="display:block;font-size:11px;font-weight:700;color:#0F766E;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Votre code de sécurité à 6 chiffres</span>
                <span style="font-size:26px;font-weight:900;letter-spacing:4px;color:#0F766E;font-family:monospace;">' . htmlspecialchars($resetCode, ENT_QUOTES, 'UTF-8') . '</span>
              </div>';
}

$htmlContent .= '
              <p style="font-size:12px;line-height:18px;color:#64748B;margin:24px 0 0;">
                Ce lien et ce code sont valables pendant <strong>60 minutes</strong>. Si vous n\'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute tranquillité, votre compte reste parfaitement protégé.
              </p>
              
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
              
              <p style="font-size:11px;color:#94A3B8;margin:0;word-break:break-all;">
                Lien direct : <a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '" style="color:#0F766E;">' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '</a>
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
</html>';

$payload = json_encode([
    'from' => $fromEmail,
    'to' => [$email],
    'subject' => 'Clinigo — Réinitialisation de votre mot de passe 🔒',
    'html' => $htmlContent,
    'tags' => [
        ['name' => 'category', 'value' => 'password_reset'],
        ['name' => 'app', 'value' => 'clinigo']
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
        'email' => $email
    ]);
} else {
    http_response_code($httpCode ?: 502);
    echo json_encode([
        'error' => $result['message'] ?? 'Erreur lors de l\'envoi via Resend',
        'details' => $result
    ]);
}
