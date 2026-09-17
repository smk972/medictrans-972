import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Sparkles,
  Link2,
  Image as ImageIcon,
  AlertTriangle,
  Lightbulb,
  Columns,
  Eye,
  Check,
  X,
  RefreshCw,
  Send,
  FileText
} from 'lucide-react';
import { AiSeoService } from '../../services/aiSeoService';
import { renderMarkdownContent } from '../../utils/markdownRenderer';

export interface AdminRichMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  targetKeyword?: string;
  articleTitle?: string;
  onSave?: () => void;
  placeholder?: string;
  minRows?: number;
}

export const AdminRichMarkdownEditor: React.FC<AdminRichMarkdownEditorProps> = ({
  value,
  onChange,
  targetKeyword = '',
  articleTitle = '',
  onSave,
  placeholder = 'Rédigez votre article en Markdown...',
  minRows = 20,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Vue : Éditeur seul, Aperçu direct, ou Double écran (Split)
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('edit');

  // Sélection courante
  const [selection, setSelection] = useState<{ start: number; end: number; text: string }>({
    start: 0,
    end: 0,
    text: '',
  });

  // Modal / Popover Assistant IA
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState<string>('transformer_en_tableau');
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [aiSelectedText, setAiSelectedText] = useState<string>('');
  const [aiResultText, setAiResultText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Notification flash (ex: "Tableau inséré !", "Copié !")
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Met à jour l'état de sélection quand le curseur bouge
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value.substring(start, end);
    setSelection({ start, end, text });
  }, []);

  // Remplacement de sélection dans la zone de texte
  const replaceSelectionRange = useCallback(
    (newText: string, selectNew = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      let start = textarea.selectionStart;
      let end = textarea.selectionEnd;
      if (start === end && selection.text && selection.end > selection.start) {
        start = selection.start;
        end = selection.end;
      }

      const currentVal = textarea.value;
      const updated = currentVal.substring(0, start) + newText + currentVal.substring(end);
      onChange(updated);

      setTimeout(() => {
        textarea.focus();
        if (selectNew) {
          textarea.setSelectionRange(start, start + newText.length);
        } else {
          textarea.setSelectionRange(start + newText.length, start + newText.length);
        }
        handleSelect();
      }, 20);
    },
    [onChange, handleSelect, selection]
  );

  // Outils de mise en forme texte habituels de CMS
  const wrapText = (before: string, after: string = '', fallbackText: string = 'texte') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === end && selection.text && selection.end > selection.start) {
      start = selection.start;
      end = selection.end;
    }

    const selected = textarea.value.substring(start, end);
    const contentToWrap = selected || fallbackText;
    const replaced = `${before}${contentToWrap}${after}`;

    replaceSelectionRange(replaced, !selected);
  };

  const prefixLines = (prefix: string, fallback: string = 'Élément') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === end && selection.text && selection.end > selection.start) {
      start = selection.start;
      end = selection.end;
    }

    const selected = textarea.value.substring(start, end);

    if (!selected) {
      replaceSelectionRange(`\n${prefix}${fallback}\n`, true);
      return;
    }

    const lines = selected.split('\n');
    const prefixed = lines.map(line => (line.startsWith(prefix) ? line : `${prefix}${line}`)).join('\n');
    replaceSelectionRange(prefixed);
  };

  const applyAlignment = (align: 'left' | 'center' | 'right') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === end && selection.text && selection.end > selection.start) {
      start = selection.start;
      end = selection.end;
    }

    let selected = textarea.value.substring(start, end);

    if (!selected) {
      selected = 'Votre texte centré ou aligné';
    }

    // Nettoyer d'anciens tags d'alignement si présents
    selected = selected.replace(/<p align="(?:left|center|right)">/g, '').replace(/<\/p>/g, '').trim();

    if (align === 'left') {
      replaceSelectionRange(selected);
    } else {
      replaceSelectionRange(`\n<p align="${align}">\n${selected}\n</p>\n`);
    }
  };

  // Convertir texte brut sélectionné en tableau Markdown
  const convertSelectionToTable = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === end && selection.text && selection.end > selection.start) {
      start = selection.start;
      end = selection.end;
    }

    let selected = textarea.value.substring(start, end).trim();

    if (!selected) {
      showToast('⚠️ Sélectionnez d\'abord le texte à convertir en tableau.');
      return;
    }

    const rawLines = selected.split('\n').map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return;

    // Détection automatique du séparateur le plus fréquent (;, tab, :, -, |)
    const sample = rawLines.slice(0, 3).join(' ');
    let separator: RegExp = /[:;\-\t|]/;

    if (sample.includes('\t')) separator = /\t/;
    else if (sample.includes(';')) separator = /;/;
    else if (sample.includes('|')) separator = /\|/;
    else if (sample.includes(':')) separator = /:/;
    else if (sample.includes(' - ')) separator = / - /;

    // Découpage des lignes en colonnes
    const parsedRows = rawLines.map(line => {
      // Nettoyer les puces de liste éventuelles au début
      const cleanLine = line.replace(/^[-*•\d.]\s*/, '');
      const parts = cleanLine.split(separator).map(p => p.trim()).filter(Boolean);
      return parts.length >= 2 ? parts : [cleanLine, 'Modalité conforme CPAM'];
    });

    // Déterminer le nombre max de colonnes
    const maxCols = Math.min(Math.max(...parsedRows.map(r => r.length), 2), 5);

    // Entêtes par défaut
    const defaultHeaders = [
      'Élément / Prestation',
      'Conditions & Modalités',
      'Prise en charge Clinigo',
      'Remarques',
      'Délai',
    ].slice(0, maxCols);

    let mdTable = `\n| ${defaultHeaders.join(' | ')} |\n`;
    mdTable += `| ${defaultHeaders.map(() => ':---').join(' | ')} |\n`;

    parsedRows.forEach(row => {
      const paddedRow = [...row];
      while (paddedRow.length < maxCols) {
        paddedRow.push('-');
      }
      mdTable += `| ${paddedRow.slice(0, maxCols).join(' | ')} |\n`;
    });
    mdTable += '\n';

    replaceSelectionRange(mdTable);
    showToast('✨ Texte converti avec succès en tableau Markdown !');
  };

  // Insertion d'un tableau vierge 3x3
  const insertBlankTable = () => {
    const template = `\n| Type de transport | Conditions d'accès | Prise en charge CPAM |\n| :--- | :--- | :--- |\n| **VSL (Véhicule Sanitaire Léger)** | Déplacement assis professionnalisé | 100% ou 65% selon ALD |\n| **Taxi Conventionné** | Transport assis médicalisé | Tiers-payant disponible |\n| **Ambulance** | Position allongée ou surveillance | 100% avec PMT justifiée |\n\n`;
    replaceSelectionRange(template);
    showToast('📊 Tableau modèle inséré dans l\'article');
  };

  // Lancement du Modal IA pour la sélection
  const openAiForSelection = (preset: string = 'transformer_en_tableau') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === end && selection.text && selection.end > selection.start) {
      start = selection.start;
      end = selection.end;
    }

    let text = textarea.value.substring(start, end).trim();

    // Si aucune sélection explicite, prendre la phrase ou le paragraphe courant
    if (!text) {
      const val = textarea.value;
      const cursor = textarea.selectionStart;
      const lastLineBreak = val.lastIndexOf('\n', cursor);
      const nextLineBreak = val.indexOf('\n', cursor);
      start = lastLineBreak === -1 ? 0 : lastLineBreak + 1;
      end = nextLineBreak === -1 ? val.length : nextLineBreak;
      text = val.substring(start, end).trim();

      if (text) {
        textarea.setSelectionRange(start, end);
        handleSelect();
      }
    }

    if (!text) {
      showToast('⚠️ Veuillez sélectionner une phrase ou un paragraphe de texte.');
      return;
    }

    setAiSelectedText(text);
    setAiInstruction(preset);
    setAiResultText('');
    setAiError(null);
    setIsAiModalOpen(true);

    // Auto-déclencher la transformation pour un confort maximal
    triggerAiTransform(text, preset);
  };

  // Appel IA transformText
  const triggerAiTransform = async (textToTransform: string, instructionKey: string, custom?: string) => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const transformed = await AiSeoService.transformText({
        text: textToTransform,
        instruction: instructionKey,
        customPrompt: custom || aiCustomPrompt,
        targetKeyword: targetKeyword,
      });
      setAiResultText(transformed);
    } catch (err: any) {
      setAiError(err.message || 'Impossible de transformer le texte');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Remplacement avec le texte généré par l'IA
  const applyAiResult = () => {
    if (!aiResultText) return;
    replaceSelectionRange(aiResultText);
    setIsAiModalOpen(false);
    showToast('✨ Sélection mise à jour avec l\'IA !');
  };

  // Raccourcis clavier (Ctrl+B, Ctrl+I, Ctrl+S)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      wrapText('**', '**', 'texte en gras');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      wrapText('*', '*', 'texte en italique');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave) onSave();
    }
  };

  // Nombre de mots et statistiques
  const wordCount = value.split(/\s+/).filter(Boolean).length;
  const charCount = value.length;
  const tableCount = (value.match(/\|[\s-]*\|/g) || []).length > 0 ? (value.match(/\n\|/g) || []).length : 0;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="bg-primary text-white text-xs font-semibold px-4 py-2 text-center transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barre d'outils CMS supérieure */}
      <div className="border-b border-outline-variant/30 bg-surface-container-low/60 p-2 flex flex-wrap items-center justify-between gap-1.5">
        {/* Groupe Mise en forme standard */}
        <div className="flex items-center flex-wrap gap-1">
          {/* Titres H2, H3, H4 */}
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Titre H2 (Section principale)"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLines('## ', 'Sous-titre H2')}
              className="px-2 py-1 text-xs font-bold text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            >
              H2
            </button>
            <button
              type="button"
              title="Titre H3 (Sous-section)"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLines('### ', 'Sous-section H3')}
              className="px-2 py-1 text-xs font-bold text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            >
              H3
            </button>
            <button
              type="button"
              title="Titre H4"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLines('#### ', 'Point H4')}
              className="px-2 py-1 text-xs font-bold text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            >
              H4
            </button>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Formatage typographique habituel CMS (Gras, Italique, Souligné, Barré) */}
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Gras (Ctrl+B)"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapText('**', '**', 'texte en gras')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italique (Ctrl+I)"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapText('*', '*', 'texte en italique')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Souligné"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapText('<u>', '</u>', 'texte souligné')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Barré"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapText('~~', '~~', 'texte barré')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Alignements habituels CMS */}
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Aligner à gauche"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyAlignment('left')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Centrer le texte"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyAlignment('center')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Aligner à droite"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyAlignment('right')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Listes & Citations */}
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Liste à puces"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLines('- ', 'Point clé')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Liste numérotée"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLines('1. ', 'Étape ordonnée')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Citation"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => prefixLines('> ', 'Citation ou mise en avant')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Callouts médicaux / pratiques */}
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Encadré Important / Réglementaire"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapText('> [!IMPORTANT]\n> **Important :** ', '\n', 'Règle CPAM ou justificatif')}
              className="px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline text-[11px]">Important</span>
            </button>
            <button
              type="button"
              title="Encadré Conseil / Astuce"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapText('> [!TIP]\n> **Conseil Clinigo :** ', '\n', 'Votre recommandation pratique')}
              className="px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline text-[11px]">Conseil</span>
            </button>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Liens & Médias */}
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Insérer un lien"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wrapText('[', '](https://clinigo.fr/reservation)', 'texte du lien')}
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Insérer une image"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                wrapText('![', '](https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200)', 'Ambulance Clinigo')
              }
              className="p-1.5 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors flex items-center"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* OUTILS TABLEAUX */}
          <div className="flex items-center gap-1 bg-teal-50/80 border border-teal-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              title="Insérer un tableau modèle Markdown"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertBlankTable}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 rounded-lg transition-colors"
            >
              <TableIcon className="w-3.5 h-3.5 text-teal-700" />
              <span>+ Tableau</span>
            </button>

            <button
              type="button"
              title="Convertir la sélection en tableau Markdown"
              onMouseDown={(e) => e.preventDefault()}
              onClick={convertSelectionToTable}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                selection.text.length > 0
                  ? 'bg-teal-700 text-white shadow-xs hover:bg-teal-800 ring-2 ring-teal-500/20'
                  : 'text-teal-800 hover:bg-teal-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Mettre en tableau</span>
            </button>
          </div>
        </div>

        {/* Côté droit : IA & Modes de vue */}
        <div className="flex items-center gap-1.5">
          {/* BOUTON MODIFIER AVEC L'IA */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openAiForSelection('transformer_en_tableau')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
              selection.text.length > 0
                ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-600 hover:opacity-95 ring-2 ring-violet-500/30 animate-pulse'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modifier avec l'IA</span>
            {selection.text.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white/25 rounded-full text-[10px] font-mono">
                {selection.text.split(/\s+/).filter(Boolean).length} mots
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Toggle View Mode */}
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-0.5 shadow-2xs">
            <button
              type="button"
              title="Mode Éditeur"
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'edit'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Éditer</span>
            </button>
            <button
              type="button"
              title="Double écran : Éditeur + Rendu direct côte à côte"
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              title="Mode Aperçu Final"
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aperçu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulle flottante d'action rapide si sélection active dans la zone de texte */}
      {selection.text.trim().length > 3 && viewMode !== 'preview' && (
        <div className="bg-slate-900 text-white text-xs px-3 py-1.5 flex items-center justify-between gap-2 shadow-md border-b border-slate-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sélection ({selection.text.split(/\s+/).filter(Boolean).length} mots) :</span>
            <span className="font-mono text-teal-300 max-w-xs truncate">
              "{selection.text.slice(0, 45)}..."
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={convertSelectionToTable}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-[11px] border border-teal-500/30 transition-colors"
            >
              <TableIcon className="w-3 h-3" />
              <span>En tableau</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openAiForSelection('transformer_en_tableau')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-teal-500 hover:opacity-90 text-white font-bold text-[11px] shadow-xs transition-opacity"
            >
              <Sparkles className="w-3 h-3" />
              <span>Modifier avec l'IA ✨</span>
            </button>
          </div>
        </div>
      )}

      {/* Zone de contenu principale (Éditeur, Split, ou Aperçu) */}
      <div className="relative flex-1 min-h-[420px]">
        {/* Vue 1: Éditeur seul ou Volet gauche de Split */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`h-full ${
              viewMode === 'split' ? 'w-full lg:w-1/2 lg:border-r border-outline-variant/30 inline-block align-top' : 'w-full'
            }`}
          >
            <textarea
              id="admin-rich-content-editor"
              ref={textareaRef}
              rows={minRows}
              value={value}
              onChange={e => onChange(e.target.value)}
              onSelect={handleSelect}
              onKeyUp={handleSelect}
              onMouseUp={handleSelect}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full h-full min-h-[420px] p-4 text-xs sm:text-sm font-mono leading-relaxed bg-surface-container-lowest text-on-surface focus:outline-none resize-y"
            />
          </div>
        )}

        {/* Vue 2: Volet droit de Split ou Mode Aperçu complet */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`h-full overflow-y-auto p-6 bg-slate-50/50 ${
              viewMode === 'split' ? 'w-full lg:w-1/2 inline-block align-top' : 'w-full'
            }`}
          >
            <div className="max-w-3xl mx-auto">
              <div className="mb-4 pb-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-teal-600">visibility</span>
                  <span>Rendu direct du blog</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Exactement conforme à la mise en page publique
                </span>
              </div>

              {value.trim() ? (
                <div className="prose prose-slate max-w-none text-slate-800">
                  {renderMarkdownContent(value)}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Commencez à taper du texte pour voir l'aperçu en direct avec vos tableaux, callouts et titres...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barre de statut inférieure */}
      <div className="border-t border-outline-variant/30 bg-surface-container-low/40 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-on-surface-variant">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-on-surface">
            {wordCount} <span className="font-normal text-on-surface-variant">mots</span>
          </span>
          <span>•</span>
          <span>{charCount} caractères</span>
          {tableCount > 0 && (
            <>
              <span>•</span>
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">table</span>
                <span>Tableaux détectés</span>
              </span>
            </>
          )}
          {targetKeyword && (
            <>
              <span>•</span>
              <span>
                Mot-clé : <strong className="text-primary">{targetKeyword}</strong>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant/80">
            Raccourcis : <strong>Ctrl+B</strong> gras, <strong>Ctrl+I</strong> italique, <strong>Ctrl+S</strong> sauvegarder
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL / POPOVER ASSISTANT IA INLINE */}
      {/* ========================================================================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header modal */}
            <div className="p-5 border-b border-outline-variant/30 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-teal-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Modifier la sélection avec l'IA</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Transformation intelligente, mise en tableau ou optimisation éditoriale
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Texte sélectionné d'origine */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span>Texte sélectionné à modifier</span>
                    <span className="text-[11px] font-normal text-on-surface-variant">
                      ({aiSelectedText.split(/\s+/).filter(Boolean).length} mots)
                    </span>
                  </label>
                </div>
                <div className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/30 text-xs font-mono text-on-surface max-h-24 overflow-y-auto">
                  {aiSelectedText}
                </div>
              </div>

              {/* Choix des actions rapides */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Action souhaitée :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiInstruction('transformer_en_tableau');
                      triggerAiTransform(aiSelectedText, 'transformer_en_tableau');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                      aiInstruction === 'transformer_en_tableau'
                        ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold ring-2 ring-teal-500/20'
                        : 'border-outline-variant/40 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-teal-700 font-bold">
                      <TableIcon className="w-4 h-4" />
                      <span>En tableau</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">
                      Structure en colonnes comparatives
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiInstruction('reformuler');
                      triggerAiTransform(aiSelectedText, 'reformuler');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                      aiInstruction === 'reformuler'
                        ? 'border-violet-600 bg-violet-50/80 text-violet-900 font-bold ring-2 ring-violet-500/20'
                        : 'border-outline-variant/40 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-violet-700 font-bold">
                      <RefreshCw className="w-4 h-4" />
                      <span>Reformuler</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">
                      Améliore le style et la fluidité
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiInstruction('simplifier');
                      triggerAiTransform(aiSelectedText, 'simplifier');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                      aiInstruction === 'simplifier'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-outline-variant/40 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <Lightbulb className="w-4 h-4" />
                      <span>Simplifier</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">
                      Pédagogique pour les patients
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiInstruction('raccourcir');
                      triggerAiTransform(aiSelectedText, 'raccourcir');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                      aiInstruction === 'raccourcir'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                        : 'border-outline-variant/40 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                      <FileText className="w-4 h-4" />
                      <span>Raccourcir</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">
                      Synthèse concise à l'essentiel
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiInstruction('developper');
                      triggerAiTransform(aiSelectedText, 'developper');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                      aiInstruction === 'developper'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'border-outline-variant/40 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Développer</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">
                      Ajoute du contexte et précisions
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiInstruction('optimiser_seo');
                      triggerAiTransform(aiSelectedText, 'optimiser_seo');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                      aiInstruction === 'optimiser_seo'
                        ? 'border-amber-600 bg-amber-50/80 text-amber-900 font-bold ring-2 ring-amber-500/20'
                        : 'border-outline-variant/40 hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Optimiser SEO</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">
                      Renforce le mot-clé cible
                    </span>
                  </button>
                </div>
              </div>

              {/* Champ consigne personnalisée */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Ou consigne sur-mesure (optionnelle) :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiCustomPrompt}
                    onChange={e => setAiCustomPrompt(e.target.value)}
                    placeholder="Ex: Transformer en comparatif VSL vs Ambulance avec les tarifs..."
                    className="flex-1 px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setAiInstruction('custom');
                        triggerAiTransform(aiSelectedText, 'custom', aiCustomPrompt);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={isAiLoading || !aiCustomPrompt.trim()}
                    onClick={() => {
                      setAiInstruction('custom');
                      triggerAiTransform(aiSelectedText, 'custom', aiCustomPrompt);
                    }}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Appliquer</span>
                  </button>
                </div>
              </div>

              {/* Message d'erreur */}
              {aiError && (
                <div className="p-3 bg-error-container/20 border border-error/30 text-error text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-error" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Résultat généré */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Résultat généré (Prêt à insérer)</span>
                  </label>
                  {aiResultText && (
                    <button
                      type="button"
                      onClick={() => triggerAiTransform(aiSelectedText, aiInstruction, aiCustomPrompt)}
                      disabled={isAiLoading}
                      className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Régénérer</span>
                    </button>
                  )}
                </div>

                {isAiLoading ? (
                  <div className="p-8 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Transformation en cours par Gemini 2.5 Flash...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={aiResultText}
                      onChange={e => setAiResultText(e.target.value)}
                      placeholder="Le texte transformé ou le tableau Markdown apparaîtra ici..."
                      className="w-full p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/40 text-xs font-mono text-on-surface focus:outline-none"
                    />

                    {/* Aperçu direct si c'est un tableau */}
                    {aiResultText.includes('|') && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 overflow-x-auto text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Aperçu visuel du tableau :
                        </span>
                        <div className="prose prose-xs max-w-none">
                          {renderMarkdownContent(aiResultText)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer modal avec actions */}
            <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!aiResultText || isAiLoading}
                  onClick={() => {
                    if (!aiResultText) return;
                    replaceSelectionRange(`\n\n${aiResultText}\n\n`);
                    setIsAiModalOpen(false);
                    showToast('✅ Contenu inséré en dessous de la sélection !');
                  }}
                  className="px-3 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface disabled:opacity-40 transition-colors"
                >
                  Insérer en dessous
                </button>

                <button
                  type="button"
                  disabled={!aiResultText || isAiLoading}
                  onClick={applyAiResult}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-primary text-white text-xs font-bold hover:opacity-95 disabled:opacity-40 shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Remplacer la sélection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
