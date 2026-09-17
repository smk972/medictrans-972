export type PostStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
export type BlogPostStatus = PostStatus;

export type ContentSensitivity = 'GENERAL_INFO' | 'REGULATORY_INFO' | 'MEDICAL_INFO';

export type SchemaType = 'Article' | 'BlogPosting' | 'NewsArticle';

export type KeywordIntent = 'informationnelle' | 'navigationnelle' | 'commerciale' | 'transactionnelle' | 'informational' | 'transactional' | 'navigational';

export type KeywordPriority = 'HIGH' | 'MEDIUM' | 'LOW' | number;

export type IdeaStatus = 'pending' | 'generated' | 'used' | 'dismissed' | 'in_progress' | 'completed' | 'rejected';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  seoTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  created_at?: string;
}

export interface ArticleFaqItem {
  question: string;
  answer: string;
}
export type FaqItem = ArticleFaqItem;

export interface ArticleSource {
  title: string;
  url: string;
  organization?: string;
  checkedAt?: string;
  checked_at?: string;
  verified: boolean;
}
export type SourceItem = ArticleSource;

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  featured_image?: string;
  categoryId?: string | null;
  category_id?: string | null;
  category?: BlogCategory;
  tags?: BlogTag[];
  tagIds?: string[];
  authorId?: string;
  authorName?: string;
  author_name?: string;
  
  // Métadonnées SEO
  seoTitle?: string;
  metaTitle?: string;
  meta_title?: string;
  metaDescription?: string;
  meta_description?: string;
  focusKeyword?: string;
  targetKeyword?: string | null;
  target_keyword?: string | null;
  secondaryKeywords?: string[];
  
  // Statut & Sensibilité
  status: PostStatus;
  contentSensitivity: ContentSensitivity;
  content_sensitivity?: ContentSensitivity;
  
  // Publication & Métriques
  publishedAt?: string | null;
  published_at?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
  readingTime?: number;
  reading_time_minutes?: number;
  wordCount?: number;
  canonicalUrl?: string;
  canonical_url?: string;
  
  // Score SEO Interne (0-100)
  seoScore?: number;
  seo_score?: number;
  contentScore?: number;
  readabilityScore?: number;
  
  // Données enrichies & Sources
  schemaType?: SchemaType;
  faq?: ArticleFaqItem[];
  sources?: ArticleSource[];
  
  // Audit IA
  aiGenerated?: boolean;
  aiReviewed?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export interface SeoKeyword {
  id: string;
  keyword: string;
  searchIntent?: KeywordIntent;
  intent?: string;
  category?: string;
  priority?: KeywordPriority;
  status?: string;
  searchVolume?: number | null;
  search_volume?: number | null;
  competition?: string | number | null;
  target_audience?: string;
  targetAudience?: string;
  relatedKeywords?: string[];
  articleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeoIdea {
  id: string;
  topic: string;
  keyword?: string;
  primaryKeyword?: string | null;
  primary_keyword?: string | null;
  searchIntent?: KeywordIntent;
  search_intent?: string;
  targetAudience?: string;
  target_audience?: string;
  suggestedTitle?: string;
  priority: any;
  status: IdeaStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeoSettings {
  id?: string;
  siteName?: string;
  site_name?: string;
  siteUrl?: string;
  canonical_base_url?: string;
  canonicalBaseUrl?: string;
  title_template?: string;
  titleTemplate?: string;
  defaultAuthor?: string;
  defaultOgImage?: string;
  default_og_image?: string;
  defaultMetaDescription?: string;
  default_meta_description?: string;
  defaultLanguage?: string;
  auto_sitemap_ping?: boolean;
  updatedAt?: string;
  updated_at?: string;
}

export interface BlogRedirect {
  id: string;
  oldSlug?: string;
  old_slug?: string;
  newSlug?: string;
  new_slug?: string;
  sourcePath?: string;
  source_path?: string;
  targetPath?: string;
  target_path?: string;
  statusCode?: number;
  status_code?: number;
  createdAt?: string;
  created_at?: string;
}

export interface AiGenerationLog {
  id: string;
  operation: string;
  userId?: string;
  articleId?: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  createdAt: string;
}

export interface SeoAuditCheckItem {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface SeoAuditReport {
  score: number;
  checks: SeoAuditCheckItem[];
  level: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
}

export interface AiOutlinePlan {
  searchIntent: string;
  title: string;
  sections: Array<{
    heading: string;
    subheadings?: string[];
  }>;
  questions: string[];
  sourcesToConsult: string[];
}
