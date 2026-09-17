import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export const AdminSeoSubnav: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
      isActive
        ? 'bg-primary text-on-primary shadow-xs font-bold'
        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-2 mb-6 shadow-xs flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 min-w-max">
        <NavLink to="/admin/seo" end className={linkClass}>
          <span className="material-symbols-outlined text-base">monitoring</span>
          <span>Vue d'ensemble</span>
        </NavLink>

        <NavLink to="/admin/seo/articles" className={linkClass}>
          <span className="material-symbols-outlined text-base">article</span>
          <span>Articles</span>
        </NavLink>

        <NavLink to="/admin/seo/articles/new" className={linkClass}>
          <span className="material-symbols-outlined text-base text-amber-500">add_circle</span>
          <span className="text-amber-700 font-bold dark:text-amber-400">Rédiger / IA</span>
        </NavLink>

        <NavLink to="/admin/seo/ideas" className={linkClass}>
          <span className="material-symbols-outlined text-base">lightbulb</span>
          <span>Idées de Sujets</span>
        </NavLink>

        <NavLink to="/admin/seo/keywords" className={linkClass}>
          <span className="material-symbols-outlined text-base">key</span>
          <span>Mots-clés</span>
        </NavLink>

        <NavLink to="/admin/seo/categories" className={linkClass}>
          <span className="material-symbols-outlined text-base">folder</span>
          <span>Catégories</span>
        </NavLink>

        <NavLink to="/admin/seo/tags" className={linkClass}>
          <span className="material-symbols-outlined text-base">tag</span>
          <span>Tags</span>
        </NavLink>

        <NavLink to="/admin/seo/settings" className={linkClass}>
          <span className="material-symbols-outlined text-base">settings</span>
          <span>Paramètres SEO</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2 pl-3 border-l border-outline-variant/30 shrink-0">
        <a
          href="/blog"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-primary transition-colors"
          title="Consulter le Blog Public dans un nouvel onglet"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          <span>Blog Public</span>
        </a>
      </div>
    </div>
  );
};
