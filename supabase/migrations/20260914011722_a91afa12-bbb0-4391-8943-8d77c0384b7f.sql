CREATE TABLE public.owner_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  url text,
  category text NOT NULL DEFAULT 'OTHER',
  pinned boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by text NOT NULL DEFAULT 'owner',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.owner_posts TO service_role;

ALTER TABLE public.owner_posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX owner_posts_order_idx ON public.owner_posts (pinned DESC, display_order ASC, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_owner_posts_updated_at
BEFORE UPDATE ON public.owner_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();