-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  posts_per_week INTEGER NOT NULL,
  niche TEXT NOT NULL,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_posts table
CREATE TABLE public.weekly_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  image_description TEXT NOT NULL,
  format TEXT NOT NULL,
  caption TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_special_date BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create history_posts table
CREATE TABLE public.history_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  format TEXT NOT NULL,
  theme TEXT,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
-- Since this is a personal app without login, we'll make everything public
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_posts ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (no authentication required)
CREATE POLICY "Allow all operations on companies" ON public.companies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on weekly_posts" ON public.weekly_posts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on history_posts" ON public.history_posts
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_weekly_posts_company_week ON public.weekly_posts(company_id, week_start);
CREATE INDEX idx_history_posts_company ON public.history_posts(company_id, posted_at DESC);