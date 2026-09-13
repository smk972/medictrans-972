import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  schemaJson?: Record<string, any>;
  noIndex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalPath,
  ogImage = '/assets/medictrans_hero_discover.jpg',
  ogType = 'website',
  schemaJson,
  noIndex = false,
}) => {
  const location = useLocation();
  const currentPath = canonicalPath || location.pathname;
  const canonicalUrl = `https://medictrans972.fr${currentPath}`;
  const fullImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `https://medictrans972.fr${ogImage}`;

  useEffect(() => {
    // 1. Mettre à jour le titre du document
    document.title = title;

    // 2. Mettre à jour ou créer la méta-description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 2b. Mettre à jour meta robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute(
      'content',
      noIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 3. Mettre à jour l'URL canonique
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 4. Mettre à jour Open Graph
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:url', canonicalUrl);
    setMeta('og:image', fullImageUrl);
    setMeta('og:type', ogType);

    // 5. Mettre à jour Twitter Cards
    const setTwitterMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setTwitterMeta('twitter:title', title);
    setTwitterMeta('twitter:description', description);
    setTwitterMeta('twitter:image', fullImageUrl);

    // 6. Injection dynamique de données structurées Schema.org JSON-LD
    let scriptSchema = document.getElementById('page-dynamic-schema') as HTMLScriptElement | null;
    if (schemaJson) {
      if (!scriptSchema) {
        scriptSchema = document.createElement('script');
        scriptSchema.id = 'page-dynamic-schema';
        scriptSchema.type = 'application/ld+json';
        document.head.appendChild(scriptSchema);
      }
      scriptSchema.textContent = JSON.stringify(schemaJson);
    } else if (scriptSchema) {
      scriptSchema.remove();
    }
  }, [title, description, canonicalUrl, fullImageUrl, ogType, schemaJson, noIndex]);

  return null;
};
