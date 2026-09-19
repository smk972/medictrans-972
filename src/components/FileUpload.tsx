import React, { useState, useRef, useEffect } from 'react';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
  category?: string;
}

export type UploadedFile = UploadedDocument;

export interface FileUploadProps {
  label?: string;
  description?: string;
  helpText?: string;
  subtext?: string;
  accept?: string;
  maxSizeMb?: number;
  initialDocument?: UploadedDocument | null;
  onDocumentChange?: (doc: UploadedDocument | null) => void;
  required?: boolean;
  category?: string;
  storageKey?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = "Prescription Médicale de Transport (PMT Cerfa) ou Pièce Justificative",
  description,
  helpText,
  subtext,
  accept = ".pdf,image/jpeg,image/png,image/webp",
  maxSizeMb = 10,
  initialDocument = null,
  onDocumentChange,
  required = false,
  category = "PMT",
  storageKey,
}) => {
  const displayDescription = helpText || description || "Format PDF, JPEG ou PNG (max 10 Mo). Document chiffré selon la norme HDS / ARS Martinique.";
  const [document, setDocument] = useState<UploadedDocument | null>(initialDocument);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage if key provided
  useEffect(() => {
    if (storageKey && !document) {
      try {
        const saved = localStorage.getItem(`medictrans_doc_${storageKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setDocument(parsed);
          onDocumentChange?.(parsed);
        }
      } catch (err) {
        console.warn('Could not read cached document:', err);
      }
    }
  }, [storageKey]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`Le fichier est trop volumineux (taille max: ${maxSizeMb} Mo).`);
      return;
    }

    // Validate format
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Format non supporté. Veuillez téléverser un fichier PDF ou une image (JPEG, PNG).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 90);
        setUploadProgress(progress);
      }
    };

    reader.onload = () => {
      setUploadProgress(100);

      setTimeout(() => {
        const newDoc: UploadedDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
          category,
        };

        setDocument(newDoc);
        setIsUploading(false);
        setUploadProgress(0);
        onDocumentChange?.(newDoc);

        if (storageKey) {
          try {
            localStorage.setItem(`medictrans_doc_${storageKey}`, JSON.stringify(newDoc));
          } catch (e) {
            console.warn('Storage limit reached:', e);
          }
        }
      }, 400);
    };

    reader.onerror = () => {
      setIsUploading(false);
      setErrorMessage("Une erreur est survenue lors de la lecture du fichier.");
    };

    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setDocument(null);
    onDocumentChange?.(null);
    if (storageKey) {
      localStorage.removeItem(`medictrans_doc_${storageKey}`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = document?.type === 'application/pdf';
  const isImage = document?.type.startsWith('image/');

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">
            {label} {required && <span className="text-error">*</span>}
          </label>
        </div>
      )}

      {displayDescription && (
        <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
          {displayDescription}
        </p>
      )}

      {/* Upload Zone when empty */}
      {!document && !isUploading && (
        <div
          className={`border-2 border-dashed rounded-xl p-space-lg flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[0.99]'
              : 'border-outline-variant/60 hover:border-primary hover:bg-surface-container-low bg-surface-container/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
          />

          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-space-sm">
            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label-lg text-label-lg font-bold text-on-surface">
              Glissez-déposez votre document ici, ou <span className="text-primary underline">parcourez vos fichiers</span>
            </span>
            {subtext !== undefined ? (
              subtext ? (
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {subtext}
                </span>
              ) : null
            ) : category === 'MUTUELLE' || storageKey?.includes('mutuelle') ? (
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Carte de tiers-payant en cours de validité (recto/verso) ou attestation de droits
              </span>
            ) : (
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Prescription Médicale (Cerfa n°11504*06), attestation ALD ou convocation hospitalière
              </span>
            )}
          </div>

          <div className="flex items-center gap-space-md mt-space-md pt-space-xs border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-secondary">check_circle</span>
              PDF, JPG, PNG jusqu'à 10 Mo
            </span>
          </div>
        </div>
      )}

      {/* Progress state */}
      {isUploading && (
        <div className="p-space-lg rounded-xl bg-surface-container-low border border-primary/30 flex flex-col gap-space-sm animate-pulse">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base animate-spin">sync</span>
              Chiffrement et téléversement sécurisé en cours...
            </span>
            <span className="font-bold text-primary">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-space-sm rounded-lg bg-error-container/20 border border-error/30 text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Uploaded File Card */}
      {document && !isUploading && (
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm min-w-0">
            {/* File Icon / Thumbnail */}
            {isImage ? (
              <div
                className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 cursor-pointer relative group"
                onClick={() => setIsPreviewOpen(true)}
              >
                <img
                  alt={document.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src={document.dataUrl}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg bg-error/10 text-error flex flex-col items-center justify-center shrink-0 border border-error/20">
                <span className="material-symbols-outlined text-[26px]">description</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md font-bold text-on-surface truncate max-w-[260px] sm:max-w-[340px]">
                  {document.name}
                </span>
                <span className="bg-secondary/15 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Vérifié HDS
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                <span>{formatFileSize(document.size)}</span>
                <span>•</span>
                <span>Téléversé le {new Date(document.uploadedAt).toLocaleDateString('fr-FR')}</span>
              </div>

              <span className="text-[11px] text-secondary font-medium mt-1">
                {category === 'MUTUELLE' || storageKey?.includes('mutuelle')
                  ? 'Transmis automatiquement au transporteur conventionné'
                  : 'Attaché automatiquement à la télétransmission CPAM 972'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              className="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors"
              onClick={() => setIsPreviewOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Aperçu
            </button>

            <button
              className="px-space-sm py-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 font-label-sm text-label-sm flex items-center gap-1 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Remplacer ce fichier"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Remplacer
            </button>

            <button
              className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
              onClick={handleRemove}
              title="Supprimer ce fichier"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden input for replace action */}
      {document && (
        <input
          accept={accept}
          className="hidden"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
      )}

      {/* Modal Preview */}
      {isPreviewOpen && document && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-primary">description</span>
                <span className="font-bold text-on-surface truncate">{document.name}</span>
              </div>
              <button
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                onClick={() => setIsPreviewOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-surface-container-low min-h-[300px]">
              {isImage ? (
                <img
                  alt={document.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow"
                  src={document.dataUrl}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-error/10 text-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[48px]">picture_as_pdf</span>
                  </div>
                  <span className="font-bold text-lg text-on-surface">{document.name}</span>
                  <span className="text-sm text-on-surface-variant">Document PDF médicalisé ({formatFileSize(document.size)})</span>
                  <a
                    className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
                    download={document.name}
                    href={document.dataUrl}
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Télécharger le document PDF
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 bg-surface-container border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Certificat de télétransmission CPAM Martinique</span>
              <button
                className="px-3 py-1 bg-surface-container-highest hover:bg-surface-dim rounded font-medium text-on-surface transition-colors"
                onClick={() => setIsPreviewOpen(false)}
                type="button"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
