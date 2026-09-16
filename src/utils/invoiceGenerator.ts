import { TransporterInvoice, Transporter } from '../types';

/**
 * Génère et imprime une facture professionnelle au format PDF pour le transporteur
 */
export const downloadOrPrintInvoice = (
  invoice: TransporterInvoice,
  transporter?: { companyName?: string; siret?: string; address?: string; city?: string; postalCode?: string; phone?: string; email?: string }
) => {
  const companyName = transporter?.companyName || 'Entreprise de Transport Sanitaire';
  const siret = transporter?.siret || '892 345 678 00012';
  const address = transporter?.address || 'Zone d\'Activité Médicale';
  const city = transporter?.city || 'Fort-de-France';
  const postalCode = transporter?.postalCode || '97200';
  const phone = transporter?.phone || '0696 75 20 20';
  const email = transporter?.email || 'dispatch@medictrans.fr';

  const isFree = invoice.amount === 0 || invoice.status === 'TRIAL_FREE';
  const totalHt = invoice.amount;
  const tvaRate = 0; // Exonération ou franchise en période d'essai
  const totalTtc = totalHt;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture ${invoice.invoiceNumber} - MedicTrans</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: #f8fafc; padding: 40px; color: #0f172a; }
        .invoice-box { max-width: 800px; margin: auto; background: white; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 24px; margin-bottom: 30px; }
        .logo-title { font-size: 26px; font-weight: 900; color: #0f766e; letter-spacing: -0.5px; }
        .logo-sub { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .invoice-meta { text-align: right; }
        .invoice-title { font-size: 20px; font-weight: 800; color: #0f172a; }
        .invoice-ref { font-family: monospace; font-size: 13px; font-weight: 700; color: #0f766e; margin-top: 4px; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 36px; gap: 40px; }
        .party { flex: 1; font-size: 12px; line-height: 1.6; }
        .party-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px; }
        .party-name { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
        th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-weight: 700; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
        .text-right { text-align: right; }
        .total-box { margin-left: auto; width: 280px; font-size: 13px; margin-bottom: 30px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .total-row.final { font-size: 16px; font-weight: 800; color: #0f766e; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 6px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.5; }
        @media print {
          body { background: white; padding: 0; }
          .invoice-box { border: none; box-shadow: none; padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div>
            <div class="logo-title">MedicTrans</div>
            <div class="logo-sub">Plateforme Nationale de Transport Sanitaire Conventionné</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
              SAS MedicTrans France • SIRET 912 345 678 00019 • RCS Fort-de-France<br>
              Agréé pour la coordination et télétransmission CPAM / ARS
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">FACTURE ACQUITTÉE</div>
            <div class="invoice-ref">${invoice.invoiceNumber}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date d'émission : ${new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
            <div style="margin-top: 8px;">
              <span class="badge badge-paid">✓ ${isFree ? 'Offert / Essai Gratuit' : 'Payé'}</span>
            </div>
          </div>
        </div>

        <div class="parties">
          <div class="party">
            <div class="party-title">Émetteur du service</div>
            <div class="party-name">MedicTrans Santé</div>
            <div>Plateforme numérique de dispatching</div>
            <div>contact@medictrans.fr • Support Pro : 0596 72 00 97</div>
          </div>

          <div class="party">
            <div class="party-title">Client / Entreprise Sanitaire</div>
            <div class="party-name">${companyName}</div>
            <div>${address}</div>
            <div>${postalCode} ${city}</div>
            <div>SIRET : ${siret}</div>
            <div>Contact : ${phone} • ${email}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Désignation de la prestation</th>
              <th>Période</th>
              <th class="text-right">TVA</th>
              <th class="text-right">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${invoice.description}</strong><br>
                <span style="font-size: 11px; color: #64748b;">
                  Accès illimité aux courses régulées, dispatching intelligent de flotte, liaison PMT et télétransmission CPAM.
                </span>
              </td>
              <td>${invoice.periodStart ? `${new Date(invoice.periodStart).toLocaleDateString('fr-FR')} au ${new Date(invoice.periodEnd || invoice.periodStart).toLocaleDateString('fr-FR')}` : '30 jours'}</td>
              <td class="text-right">0,00 %</td>
              <td class="text-right" style="font-family: monospace; font-weight: 700;">${totalHt.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row">
            <span>Total Hors Taxes (HT) :</span>
            <span style="font-family: monospace; font-weight: 700;">${totalHt.toFixed(2)} €</span>
          </div>
          <div class="total-row">
            <span>TVA (0.00%) :</span>
            <span style="font-family: monospace; font-weight: 700;">0.00 €</span>
          </div>
          <div class="total-row final">
            <span>Total Net à Payer (TTC) :</span>
            <span style="font-family: monospace;">${totalTtc.toFixed(2)} €</span>
          </div>
        </div>

        <div class="footer">
          MedicTrans France SAS — Capital social 50 000 € — N° TVA Intracommunautaire FR 82 912345678.<br>
          En cas de contestation, le tribunal de commerce compétent est celui du siège social de l'émetteur.<br>
          Facture générée électroniquement et certifiée conforme aux exigences fiscales et sanitaires en vigueur.
        </div>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 24px;">
        <button onclick="window.print()" style="padding: 12px 24px; background: #0f766e; color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          🖨️ Imprimer ou Enregistrer en PDF
        </button>
      </div>

      <script>
        window.onload = function() {
          // Déclenche automatiquement la boîte de dialogue d'impression après un court délai
          setTimeout(function() { window.print(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
