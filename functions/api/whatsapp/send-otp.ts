interface SendOtpRequestBody {
  phone: string;
  code: string;
}

export async function onRequestPost(context: { request: Request; env: any }) {
  try {
    const body: SendOtpRequestBody = await context.request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return new Response(JSON.stringify({
        success: false,
        error: "Numéro de téléphone ou code manquant."
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const phoneNumberId = context.env?.WHATSAPP_PHONE_NUMBER_ID || '1393408537178633';
    const accessToken = context.env?.WHATSAPP_ACCESS_TOKEN || 'EAAQNZAZAxZCXyABSd7kxlMxu8fSJmHzMA4MZCbkCQbI6ROeJuHXfYxlGmLLWEqA5lu6PffZBY9JGVEG57juFAexn28CBvJYGV0wqXChS3pjWtF3LzV6DCrDVQYUGEG9607ZAVub9PrivrdFLKPUYiCNMd072k57JPpew6U2GMYk0mIJBYPUZBhcdlvAknb55ZBZCFobD4r4fZAtpzKFodJMhugL1EuxOBHFEZByn58uuZCBIDlAr8xzSPdBl1A5jHxxodwubBEj0TSDvCcdqdeBfPnPs';

    // Normaliser le numéro au format international sans le signe '+'
    const cleanDigits = phone.replace(/\D/g, '');
    let targetPhone = cleanDigits;

    if (cleanDigits.startsWith('0696') || cleanDigits.startsWith('0796')) {
      targetPhone = '596' + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith('0690') || cleanDigits.startsWith('0790')) {
      targetPhone = '590' + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith('0694')) {
      targetPhone = '594' + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith('0692') || cleanDigits.startsWith('0693')) {
      targetPhone = '262' + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith('06') || cleanDigits.startsWith('07')) {
      targetPhone = '33' + cleanDigits.slice(1);
    }

    // 1. Essai d'envoi du message texte direct avec le code
    const messagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: targetPhone,
      type: "text",
      text: {
        preview_url: false,
        body: `*Clinigo — Transport Médical*\n\nVotre code confidentiel pour débloquer vos 30 jours d'essai gratuit est : *${code}*\n\nEntrez ce code sur votre tableau de bord pour activer immédiatement votre compte.`
      }
    };

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    const result: any = await response.json();

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        messageId: result?.messages?.[0]?.id,
        targetPhone
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // En cas d'erreur de fenêtre 24h fermée (code 131047), tenter avec un modèle ou notifier
    const errorCode = result?.error?.code;
    const errorDetails = result?.error?.error_data?.details || result?.error?.message || "Erreur Meta WhatsApp Cloud API.";

    return new Response(JSON.stringify({
      success: false,
      errorCode,
      error: errorDetails,
      raw: result
    }), {
      status: 200, // Retour 200 pour gestion propre dans le frontend
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || "Erreur interne lors de l'envoi WhatsApp."
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
