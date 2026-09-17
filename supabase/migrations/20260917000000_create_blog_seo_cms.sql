-- ==============================================================================
-- MIGRATION : CLINIGO CONTENT HUB — CMS SEO & AI PIPELINE
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'review', 'scheduled', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE content_sensitivity AS ENUM ('GENERAL_INFO', 'REGULATORY_INFO', 'MEDICAL_INFO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE schema_type AS ENUM ('Article', 'BlogPosting', 'NewsArticle');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE keyword_intent AS ENUM ('informationnelle', 'navigationnelle', 'commerciale', 'transactionnelle');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE keyword_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE idea_status AS ENUM ('pending', 'generated', 'used', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE BLOG_CATEGORIES
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE BLOG_TAGS
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE BLOG_POSTS
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  featured_image_alt TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT 'Équipe Rédactionnelle Clinigo',
  
  -- SEO & Mots-clés
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  secondary_keywords TEXT[] DEFAULT '{}',
  
  -- Statut et sensibilité médicale
  status post_status DEFAULT 'draft' NOT NULL,
  content_sensitivity content_sensitivity DEFAULT 'GENERAL_INFO' NOT NULL,
  
  -- Horodatage et lecture
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reading_time INT DEFAULT 5,
  word_count INT DEFAULT 0,
  canonical_url TEXT,
  
  -- Scores internes (sur 100)
  seo_score INT DEFAULT 0,
  content_score INT DEFAULT 0,
  readability_score INT DEFAULT 0,
  
  -- Données enrichies & FAQ
  schema_type schema_type DEFAULT 'Article' NOT NULL,
  faq JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  
  -- Traçabilité IA
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_reviewed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. TABLE BLOG_POST_TAGS (Association N-N)
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- 6. TABLE SEO_KEYWORDS
CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  search_intent keyword_intent DEFAULT 'informationnelle',
  category TEXT,
  priority keyword_priority DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'ACTIVE',
  search_volume INT DEFAULT NULL,
  competition TEXT DEFAULT NULL,
  related_keywords TEXT[] DEFAULT '{}',
  article_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE SEO_IDEAS
CREATE TABLE IF NOT EXISTS public.seo_ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic TEXT NOT NULL,
  keyword TEXT NOT NULL,
  search_intent keyword_intent DEFAULT 'informationnelle',
  suggested_title TEXT NOT NULL,
  priority keyword_priority DEFAULT 'MEDIUM',
  status idea_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE SEO_SETTINGS
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_name TEXT DEFAULT 'Clinigo',
  site_url TEXT DEFAULT 'https://clinigo.fr',
  default_author TEXT DEFAULT 'Équipe Rédactionnelle Clinigo',
  default_og_image TEXT DEFAULT '/assets/clinigo-logo.png',
  default_meta_description TEXT DEFAULT 'Guides et actualités officiels sur le transport sanitaire conventionné en France et dans les DOM.',
  default_language TEXT DEFAULT 'fr-FR',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLE BLOG_REDIRECTS (Suivi 301 pour changements de slugs)
CREATE TABLE IF NOT EXISTS public.blog_redirects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  old_slug TEXT NOT NULL UNIQUE,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLE AI_GENERATION_LOGS
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  article_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  model TEXT DEFAULT 'gemini-2.5-flash',
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_ideas_status ON public.seo_ideas(status);

-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique (Articles publiés et catégories)
CREATE POLICY "Public can view published blog posts" ON public.blog_posts
  FOR SELECT USING (status = 'published' AND (published_at IS NULL OR published_at <= NOW()));

CREATE POLICY "Public can view blog categories" ON public.blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view blog tags" ON public.blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Public can view blog post tags" ON public.blog_post_tags
  FOR SELECT USING (true);

-- Politiques de gestion intégrale pour les Administrateurs
CREATE POLICY "Admins have full access to blog_posts" ON public.blog_posts
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to blog_categories" ON public.blog_categories
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to blog_tags" ON public.blog_tags
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to blog_post_tags" ON public.blog_post_tags
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to seo_keywords" ON public.seo_keywords
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to seo_ideas" ON public.seo_ideas
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to seo_settings" ON public.seo_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to blog_redirects" ON public.blog_redirects
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

CREATE POLICY "Admins have full access to ai_generation_logs" ON public.ai_generation_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );
