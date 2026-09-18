import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Smartphone, RefreshCw, X, AlertCircle, CheckCircle2, ArrowRight, Edit3 } from 'lucide-react';
import { OtpService, formatPhoneForDisplay, normalizeToE164 } from '../services/otpService';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  phone: string;
  onSuccess: () => void;
  onClose: () => void;
  onPhoneChange?: (newPhone: string) => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  phone,
  onSuccess,
  onClose,
  onPhoneChange,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState(phone);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Déclencher l'envoi dès l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setSuccess(false);
      setEditedPhone(phone);
      setIsEditingPhone(false);
      sendSmsCode(phone);
    }
  }, [isOpen, phone]);

  // Gestion du compte à rebours pour le renvoi
  useEffect(() => {
    let timer: any;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const sendSmsCode = async (targetPhone: string) => {
    setIsSending(true);
    setError(null);
    setCanResend(false);
    setCountdown(60);

    const res = await OtpService.sendOtp(targetPhone);
    setIsSending(false);

    if (res.success) {
      if (res.demoCode) {
        setDemoCode(res.demoCode);
      }
      // Focus le premier champ dès l'envoi
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    } else {
      setError(res.error || 'Erreur lors de l’envoi du SMS.');
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleanVal = value.replace(/\D/g, '');

    // Gestion du collage direct (ex: 6 chiffres collés)
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      if (pasted.length === 6) {
        verifyCode(newDigits.join(''));
      } else {
        const nextEmpty = newDigits.findIndex(d => !d);
        if (nextEmpty !== -1) inputRefs.current[nextEmpty]?.focus();
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Passage au champ suivant si un chiffre a été entré
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si tous les 6 chiffres sont saisis, déclencher la validation automatique
    if (cleanVal && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    setError(null);

    const targetPhone = isEditingPhone ? editedPhone : phone;
    const res = await OtpService.verifyOtp(targetPhone, codeToVerify);
    setIsVerifying(false);

    if (res.success && res.verified) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setError(res.error || 'Code de vérification incorrect. Veuillez vérifier le SMS reçu.');
    }
  };

  const handleResend = () => {
    if (!canResend || isSending) return;
    setDigits(['', '', '', '', '', '']);
    sendSmsCode(isEditingPhone ? editedPhone : phone);
  };

  const handleSaveEditedPhone = () => {
    const clean = editedPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Numéro de téléphone invalide (10 chiffres requis).');
      return;
    }
    setIsEditingPhone(false);
    if (onPhoneChange) {
      onPhoneChange(editedPhone);
    }
    sendSmsCode(editedPhone);
  };

  const fillDemoCode = () => {
    if (!demoCode) return;
    const codeArr = demoCode.slice(0, 6).split('');
    setDigits(codeArr);
    verifyCode(demoCode);
  };

  if (!isOpen) return null;

  const currentDisplayPhone = formatPhoneForDisplay(isEditingPhone ? editedPhone : phone);
  const e164 = normalizeToE164(isEditingPhone ? editedPhone : phone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-b from-teal-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/10 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Sécurisation du transport</h3>
              <p className="text-xs text-slate-500">Vérification instantanée par SMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto scale-110 transition-transform">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg">Numéro vérifié avec succès !</h4>
              <p className="text-xs text-slate-500">Validation de votre réservation en cours...</p>
            </div>
          ) : (
            <>
              {/* Info destinataire SMS */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                      Code envoyé au
                    </span>
                    {isEditingPhone ? (
                      <input
                        type="tel"
                        value={editedPhone}
                        onChange={e => setEditedPhone(e.target.value)}
                        className="text-sm font-bold text-slate-900 bg-white border border-teal-500 rounded-lg px-2 py-0.5 mt-0.5 outline-none"
                        placeholder="0696 XX XX XX"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-900">
                        {currentDisplayPhone} <span className="text-xs font-normal text-slate-400">({e164})</span>
                      </span>
                    )}
                  </div>
                </div>

                {isEditingPhone ? (
                  <button
                    onClick={handleSaveEditedPhone}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                  >
                    Valider
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
                  >
                    <Edit3 className="w-3 h-3" />
                    Modifier
                  </button>
                )}
              </div>

              {/* Message d'aide */}
              <p className="text-xs text-slate-600 text-center">
                Entrez le code à 6 chiffres reçu par SMS pour confirmer l’authenticité de votre demande.
              </p>

              {/* Champs de saisie du code OTP à 6 chiffres */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={digit}
                    onChange={e => handleDigitChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    disabled={isVerifying || isSending}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border transition-all outline-none ${
                      digit
                        ? 'border-teal-600 bg-teal-50/30 text-teal-900 shadow-sm ring-2 ring-teal-600/10'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20'
                    }`}
                  />
                ))}
              </div>

              {/* Erreur */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Mode Test / Démo Badge si applicable */}
              {demoCode && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                  <span className="font-medium">
                    🧪 Mode Test actif : code <strong>{demoCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={fillDemoCode}
                    className="px-2 py-0.5 font-bold text-amber-800 bg-amber-200/80 hover:bg-amber-200 rounded text-[11px]"
                  >
                    Remplir
                  </button>
                </div>
              )}

              {/* Actions & Bouton de validation */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => verifyCode(digits.join(''))}
                  disabled={digits.join('').length !== 6 || isVerifying}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Vérification en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmer et valider la commande</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Renvoi SMS */}
                <div className="flex items-center justify-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isSending}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 hover:underline py-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
                      <span>Renvoyer un nouveau code par SMS</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Renvoyer un nouveau code dans <strong className="text-slate-600">{countdown}s</strong>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
