import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WelcomeEmailMockup, generateWelcomeEmailHtml, DEFAULT_EMAIL_DATA, EmailData } from '../components/email/WelcomeEmailMockup';
import { SEOHead } from '../components/SEOHead';

export const EmailPreviewPage: React.FC = () => {
  const [device, setDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [clientSkin, setClientSkin] = useState<'APPLE_MAIL' | 'GMAIL' | 'CLEAN'>('APPLE_MAIL');
  const [emailData, setEmailData] = useState<EmailData>(DEFAULT_EMAIL_DATA);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [showHtmlCode, setShowHtmlCode] = useState(false);

  const rawHtml = generateWelcomeEmailHtml(emailData);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(rawHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleDownloadHtml = () => {
    const element = document.createElement('a');
    const file = new Blob([rawHtml], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `clinigo-bienvenue-${emailData.firstName.toLowerCase()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] flex flex-col font-sans">
      <SEOHead
        title="Maquette E-mail de Bienvenue • Clinigo"
        description="Prévisualisation interactive de l'email de bienvenue Clinigo compatible Resend, Apple Mail et Gmail."
        noIndex={true}
      />

      {/* TOP CONTROL BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/assets/clinigo-icon.png" alt="Clinigo" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-[#111827] tracking-tight">
                  E-mail de Bienvenue Clinigo
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  Maquette Interactive
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Simulation fidèle Gmail & Apple Mail • Largeur 600px • Prêt pour Resend
              </p>
            </div>
          </div>

          {/* Center: Device Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setDevice('DESKTOP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                device === 'DESKTOP'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span className="material-symbols-outlined text-base">desktop_mac</span>
              <span>Desktop (600 px)</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('MOBILE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                device === 'MOBILE'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span className="material-symbols-outlined text-base">smartphone</span>
              <span>Mobile iPhone (390 px)</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Skin Selector */}
            <div className="hidden md:flex items-center gap-1 text-xs">
              <span className="text-[11px] text-[#6B7280] font-medium mr-1">Client :</span>
              <button
                type="button"
                onClick={() => setClientSkin('APPLE_MAIL')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                  clientSkin === 'APPLE_MAIL'
                    ? 'bg-white border-[#2563EB] text-[#2563EB] font-bold shadow-2xs'
                    : 'bg-transparent border-transparent text-[#6B7280] hover:bg-slate-100'
                }`}
              >
                Apple Mail
              </button>
              <button
                type="button"
                onClick={() => setClientSkin('GMAIL')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                  clientSkin === 'GMAIL'
                    ? 'bg-white border-[#2563EB] text-[#2563EB] font-bold shadow-2xs'
                    : 'bg-transparent border-transparent text-[#6B7280] hover:bg-slate-100'
                }`}
              >
                Gmail
              </button>
              <button
                type="button"
                onClick={() => setClientSkin('CLEAN')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                  clientSkin === 'CLEAN'
                    ? 'bg-white border-[#2563EB] text-[#2563EB] font-bold shadow-2xs'
                    : 'bg-transparent border-transparent text-[#6B7280] hover:bg-slate-100'
                }`}
              >
                Épuré
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowEditDataModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#374151] transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Données ({emailData.firstName})</span>
            </button>

            <button
              type="button"
              onClick={handleCopyHtml}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                copiedHtml
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {copiedHtml ? 'check' : 'code'}
              </span>
              <span>{copiedHtml ? 'Code HTML Copié !' : 'Copier HTML Resend'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHtmlCode(!showHtmlCode)}
              className="p-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827] cursor-pointer"
              title="Afficher/Masquer le code HTML source"
            >
              <span className="material-symbols-outlined text-base">terminal</span>
            </button>
          </div>

        </div>
      </header>

      {/* CODE SOURCE DRAWER (TOGGLEABLE) */}
      {showHtmlCode && (
        <div className="bg-[#1E293B] text-slate-200 border-b border-slate-700 p-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 font-bold">clinigo-welcome-template.html</span>
              <span className="text-[10px] text-slate-400 font-mono">100% table-based, inline CSS pour Resend</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHtml}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold"
              >
                {copiedHtml ? 'Copié !' : 'Copier'}
              </button>
              <button
                onClick={handleDownloadHtml}
                className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-mono text-[11px]"
              >
                Télécharger .html
              </button>
            </div>
          </div>
          <pre className="max-h-56 overflow-y-auto text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg">
            {rawHtml}
          </pre>
        </div>
      )}

      {/* MAIN PREVIEW CANVAS */}
      <main className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-center">
        
        {device === 'DESKTOP' ? (
          /* ========================================================================= */
          /* DESKTOP PREVIEW WRAPPER (600px Email inside simulated Client window)    */
          /* ========================================================================= */
          <div className="w-full max-w-[760px] animate-fadeIn">
            {clientSkin !== 'CLEAN' ? (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden">
                {/* Window Chrome */}
                <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block"></span>
                    <span className="ml-2 text-xs font-semibold text-[#6B7280]">
                      {clientSkin === 'APPLE_MAIL' ? 'Apple Mail' : 'Gmail'} • Boîte de réception
                    </span>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF]">
                    Aujourd'hui à 10:14
                  </span>
                </div>

                {/* Email Metadata Bar */}
                <div className="p-4 sm:p-5 bg-white border-b border-[#F3F4F6] text-xs space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-sm font-bold text-[#2563EB] shrink-0">
                        C
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#111827] text-sm">Clinigo</span>
                          <span className="text-[11px] text-[#6B7280] font-mono">&lt;bonjour@clinigo.fr&gt;</span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5">
                          À : <strong className="text-[#374151]">{emailData.firstName} {emailData.lastName}</strong> &lt;{emailData.email}&gt;
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[#9CA3AF]">
                      <span className="material-symbols-outlined text-lg cursor-pointer hover:text-[#111827]">reply</span>
                      <span className="material-symbols-outlined text-lg cursor-pointer hover:text-[#111827]">star</span>
                      <span className="material-symbols-outlined text-lg cursor-pointer hover:text-[#111827]">more_vert</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                      <span>Bienvenue sur Clinigo 👋</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        Important
                      </span>
                    </h2>
                  </div>
                </div>

                {/* Email Interior: Centered in #F5F7FA background, exactly as received */}
                <div className="bg-[#F5F7FA] p-6 sm:p-10 flex justify-center">
                  <WelcomeEmailMockup data={emailData} isMobile={false} />
                </div>
              </div>
            ) : (
              /* Clean View without browser frame */
              <div className="py-4">
                <WelcomeEmailMockup data={emailData} isMobile={false} />
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* MOBILE IPHONE PREVIEW WRAPPER (~390px realistic smartphone simulation)   */
          /* ========================================================================= */
          <div className="w-full max-w-[420px] animate-fadeIn flex flex-col items-center">
            {/* iPhone Shell Frame */}
            <div className="w-[390px] bg-[#1E293B] p-3 rounded-[52px] shadow-2xl border-4 border-slate-700 relative">
              
              {/* Phone Speaker / Dynamic Island */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-950/40"></span>
              </div>

              {/* iPhone Screen Container */}
              <div className="bg-[#F5F7FA] rounded-[42px] overflow-hidden border border-slate-800 text-[#111827]">
                
                {/* iOS Status Bar */}
                <div className="pt-3.5 px-6 pb-2 bg-white flex items-center justify-between text-[11px] font-bold text-slate-900 border-b border-[#F3F4F6]">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">signal_cellular_4_bar</span>
                    <span className="material-symbols-outlined text-xs">wifi</span>
                    <span className="material-symbols-outlined text-xs">battery_full</span>
                  </div>
                </div>

                {/* iOS Mail Header */}
                <div className="px-4 py-2.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#2563EB] text-xs font-semibold">
                    <span className="material-symbols-outlined text-base">arrow_back_ios</span>
                    <span>Boîtes</span>
                  </div>
                  <span className="text-xs font-bold text-[#111827]">Message</span>
                  <div className="flex items-center gap-2 text-[#2563EB]">
                    <span className="material-symbols-outlined text-base">archive</span>
                    <span className="material-symbols-outlined text-base">reply</span>
                  </div>
                </div>

                {/* Mobile Subject / Sender Bar */}
                <div className="p-4 bg-white border-b border-[#F3F4F6] text-xs space-y-1">
                  <h3 className="font-extrabold text-sm text-[#111827]">
                    Bienvenue sur Clinigo 👋
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>De : <strong className="text-[#111827]">Clinigo</strong> &lt;bonjour@clinigo.fr&gt;</span>
                    <span>10:14</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    À : {emailData.firstName} {emailData.lastName}
                  </div>
                </div>

                {/* Email Body Scrollable View */}
                <div className="max-h-[640px] overflow-y-auto p-3 bg-[#F5F7FA]">
                  <WelcomeEmailMockup data={emailData} isMobile={true} />
                </div>

                {/* iOS Bottom Navigation Bar */}
                <div className="h-10 bg-white border-t border-[#E5E7EB] flex items-center justify-center">
                  <div className="w-32 h-1 bg-slate-900/40 rounded-full"></div>
                </div>

              </div>
            </div>

            <p className="text-xs text-[#6B7280] text-center mt-3">
              Simulation écran iPhone (390 px) • Mise en page responsive automatique
            </p>
          </div>
        )}

      </main>

      {/* FOOTER SPECS BAR */}
      <footer className="bg-white border-t border-[#E5E7EB] py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-[#111827]">Caractéristiques :</span>
            <span>✓ Largeur cible 600 px</span>
            <span>✓ Fond extérieur #F5F7FA</span>
            <span>✓ Carte #F0F7FF</span>
            <span>✓ Primary #2563EB</span>
            <span>✓ Typo Apple/Inter</span>
            <span>✓ Zéro script / Table-safe</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHtml}
              className="text-[#2563EB] font-bold hover:underline cursor-pointer"
            >
              Copier le code Resend
            </button>
            <span>•</span>
            <button
              onClick={handleDownloadHtml}
              className="text-[#6B7280] hover:text-[#111827] cursor-pointer"
            >
              Télécharger le .html
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL : EDIT DATA */}
      {showEditDataModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2 text-[#2563EB]">
                <span className="material-symbols-outlined text-xl">person_edit</span>
                <h3 className="text-base font-extrabold text-[#111827]">Données de Démonstration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditDataModal(false)}
                className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#374151]">Prénom</label>
                <input
                  type="text"
                  value={emailData.firstName}
                  onChange={(e) => setEmailData({ ...emailData, firstName: e.target.value })}
                  placeholder="Dimitri"
                  className="w-full p-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold focus:border-[#2563EB] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#374151]">Nom</label>
                <input
                  type="text"
                  value={emailData.lastName}
                  onChange={(e) => setEmailData({ ...emailData, lastName: e.target.value })}
                  placeholder="Kanor"
                  className="w-full p-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold focus:border-[#2563EB] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#374151]">Adresse E-mail</label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  placeholder="dimitri@example.com"
                  className="w-full p-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold focus:border-[#2563EB] outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEmailData(DEFAULT_EMAIL_DATA)}
                className="text-xs font-bold text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                Réinitialiser (Dimitri Kanor)
              </button>
              <button
                type="button"
                onClick={() => setShowEditDataModal(false)}
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-xs hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
