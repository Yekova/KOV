export type JournalPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  clientDisplayName: string | null;
  publishedAt: string | null;
  tag: string | null;
  featured: boolean;
  readingTime: string | null;
  views: number;
};
