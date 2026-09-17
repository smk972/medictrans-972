import React from 'react';

export interface RenderMarkdownOptions {
  enableToc?: boolean;
}

/**
 * Moteur de rendu Markdown enrichi pour Clinigo.fr
 * Supporte :
 * - Titres H2, H3, H4 avec identifiants pour le sommaire
 * - Tableaux Markdown complets avec en-têtes, alignement et conteneur responsive
 * - Alignement de texte (<p align="center">, etc.)
 * - Listes à puces, numérotées et cases à cocher
 * - Blocs de citation et callouts (> [!NOTE], > [!IMPORTANT], > [!TIP])
 * - Formatage inline : gras (**), italique (*), souligné (<u>), barré (~~), liens et code
 */
export function formatInlineMarkdown(text: string): string {
  if (!text) return '';
  return text
    // Gras
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/__(.*?)__/g, '<strong class="font-bold text-slate-900">$1</strong>')
    // Italique
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
    // Barré
    .replace(/~~(.*?)~~/g, '<del class="line-through text-slate-400">$1</del>')
    // Souligné
    .replace(/<u>(.*?)<\/u>/g, '<u class="underline decoration-teal-500 decoration-2 underline-offset-2">$1</u>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 text-xs font-mono font-semibold">$1</code>')
    // Liens
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-teal-700 font-semibold underline underline-offset-2 hover:text-teal-900 transition-colors">$1</a>'
    )
    // Images inline ou standalone
    .replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" class="my-4 rounded-2xl shadow-xs max-w-full h-auto border border-slate-200" />'
    );
}

export function renderMarkdownContent(content: string, options?: RenderMarkdownOptions): React.ReactNode[] {
  if (!content) return [];

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let listItems: string[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableAlignments: ('left' | 'center' | 'right')[] = [];
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      const key = `list-${elements.length}`;
      if (listType === 'ol') {
        elements.push(
          <ol key={key} className="my-4 space-y-2 list-decimal list-inside text-slate-700 text-sm sm:text-base leading-relaxed pl-2">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={key} className="my-4 space-y-2 list-disc list-inside text-slate-700 text-sm sm:text-base leading-relaxed pl-2">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            ))}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableHeader.length > 0) {
      const key = `table-${elements.length}`;
      elements.push(
        <div key={key} className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
            <thead className="bg-slate-50/90 text-slate-900 font-bold tracking-wider uppercase text-[11px]">
              <tr>
                {tableHeader.map((th, idx) => {
                  const align = tableAlignments[idx] || 'left';
                  const alignClass =
                    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                  return (
                    <th
                      key={idx}
                      className={`px-4 py-3 border-r border-slate-200/60 last:border-r-0 ${alignClass}`}
                      dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(th) }}
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/50 hover:bg-slate-100/50 transition-colors' : 'hover:bg-slate-50/50 transition-colors'}>
                  {row.map((cell, cIdx) => {
                    const align = tableAlignments[cIdx] || 'left';
                    const alignClass =
                      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                    return (
                      <td
                        key={cIdx}
                        className={`px-4 py-3 border-r border-slate-100 last:border-r-0 text-slate-700 ${alignClass}`}
                        dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell) }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableAlignments = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Détection de Tableau Markdown (| ... |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      flushList();

      const rawCells = trimmed.slice(1, -1).split('|').map(c => c.trim());

      // Si c'est la ligne de séparation |---|---|
      const isSeparator = rawCells.every(c => /^:?-+:?$/.test(c));
      if (isSeparator) {
        tableAlignments = rawCells.map(c => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center';
          if (c.endsWith(':')) return 'right';
          return 'left';
        });
        inTable = true;
        continue;
      }

      if (!inTable) {
        // C'est la ligne d'en-tête
        tableHeader = rawCells;
        inTable = true;
      } else {
        // C'est une ligne de données
        tableRows.push(rawCells);
      }
      continue;
    } else {
      flushTable();
    }

    // 2. Listes
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inList && listType !== 'ul') flushList();
      inList = true;
      listType = 'ul';
      listItems.push(trimmed.slice(2));
      continue;
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (inList && listType !== 'ol') flushList();
      inList = true;
      listType = 'ol';
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    } else {
      flushList();
    }

    // 3. Ligne Vide
    if (!trimmed) {
      continue;
    }

    // 4. Ligne Horizontale (--- ou ***)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={i} className="my-8 border-slate-200" />);
      continue;
    }

    // 5. Titre H2 (##)
    if (trimmed.startsWith('## ')) {
      const titleText = trimmed.slice(3).replace(/[*_~`]/g, '').trim();
      const id = titleText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      elements.push(
        <h2
          key={i}
          id={id}
          className="text-xl sm:text-2xl font-black text-slate-900 mt-8 mb-4 tracking-tight scroll-mt-24 border-b border-slate-100 pb-2"
        >
          {titleText}
        </h2>
      );
      continue;
    }

    // 6. Titre H3 (###)
    if (trimmed.startsWith('### ')) {
      const titleText = trimmed.slice(4).replace(/[*_~`]/g, '').trim();
      elements.push(
        <h3 key={i} className="text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-3 tracking-tight">
          {titleText}
        </h3>
      );
      continue;
    }

    // 7. Titre H4 (####)
    if (trimmed.startsWith('#### ')) {
      const titleText = trimmed.slice(5).replace(/[*_~`]/g, '').trim();
      elements.push(
        <h4 key={i} className="text-base sm:text-lg font-bold text-slate-800 mt-4 mb-2 tracking-tight">
          {titleText}
        </h4>
      );
      continue;
    }

    // 8. Encadrés / Callouts & Citations (> ...)
    if (trimmed.startsWith('> ')) {
      const quoteBody = trimmed.slice(2).trim();

      // Callout Important / Warning
      if (quoteBody.startsWith('[!WARNING]') || quoteBody.startsWith('[!IMPORTANT]')) {
        const text = quoteBody.replace(/^\[!(WARNING|IMPORTANT)\]\s*/, '');
        elements.push(
          <div key={i} className="my-4 p-4 rounded-2xl bg-amber-50/80 border-l-4 border-amber-500 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
            <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">warning</span>
            <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
          </div>
        );
        continue;
      }

      // Callout Info / Note
      if (quoteBody.startsWith('[!NOTE]') || quoteBody.startsWith('[!INFO]')) {
        const text = quoteBody.replace(/^\[!(NOTE|INFO)\]\s*/, '');
        elements.push(
          <div key={i} className="my-4 p-4 rounded-2xl bg-blue-50/80 border-l-4 border-blue-500 text-blue-950 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
            <span className="material-symbols-outlined text-blue-600 text-xl shrink-0 mt-0.5">info</span>
            <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
          </div>
        );
        continue;
      }

      // Callout Conseil / Tip
      if (quoteBody.startsWith('[!TIP]')) {
        const text = quoteBody.replace(/^\[!TIP\]\s*/, '');
        elements.push(
          <div key={i} className="my-4 p-4 rounded-2xl bg-emerald-50/80 border-l-4 border-emerald-500 text-emerald-950 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
            <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0 mt-0.5">lightbulb</span>
            <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
          </div>
        );
        continue;
      }

      // Blockquote classique
      elements.push(
        <blockquote
          key={i}
          className="my-4 p-4 rounded-2xl bg-teal-50/60 border-l-4 border-teal-600 text-teal-950 text-sm sm:text-base italic leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(quoteBody) }}
        />
      );
      continue;
    }

    // 9. Paragraphe centré ou avec alignement
    if (trimmed.startsWith('<p align="center">') || trimmed.startsWith('<div align="center">') || trimmed.includes('class="text-center"')) {
      const cleanText = trimmed.replace(/<\/?[^>]+(>|$)/g, '');
      elements.push(
        <p
          key={i}
          className="my-3 text-center text-slate-700 text-sm sm:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanText) }}
        />
      );
      continue;
    }
    if (trimmed.startsWith('<p align="right">') || trimmed.startsWith('<div align="right">') || trimmed.includes('class="text-right"')) {
      const cleanText = trimmed.replace(/<\/?[^>]+(>|$)/g, '');
      elements.push(
        <p
          key={i}
          className="my-3 text-right text-slate-700 text-sm sm:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanText) }}
        />
      );
      continue;
    }

    // 10. Paragraphe régulier
    elements.push(
      <p
        key={i}
        className="my-3 text-slate-700 text-sm sm:text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
      />
    );
  }

  flushList();
  flushTable();

  return elements;
}
