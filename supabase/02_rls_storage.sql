-- Part 2: RLS, Storage and Triggers
-- Run this AFTER Part 1 succeeds

-- Row Level Security (RLS)
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE upscale_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all on user" ON "user";
DROP POLICY IF EXISTS "Allow all on account" ON "account";
DROP POLICY IF EXISTS "Allow all on session" ON "session";
DROP POLICY IF EXISTS "Allow all on credits" ON credits;
DROP POLICY IF EXISTS "Allow all on tasks" ON upscale_tasks;
DROP POLICY IF EXISTS "Allow all on transactions" ON credit_transactions;

-- Create policies
CREATE POLICY "Allow all on user" ON "user" FOR ALL USING (true);
CREATE POLICY "Allow all on account" ON "account" FOR ALL USING (true);
CREATE POLICY "Allow all on session" ON "session" FOR ALL USING (true);
CREATE POLICY "Allow all on credits" ON credits FOR ALL USING (true);
CREATE POLICY "Allow all on tasks" ON upscale_tasks FOR ALL USING (true);
CREATE POLICY "Allow all on transactions" ON credit_transactions FOR ALL USING (true);

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Storage policies
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'images');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'images');

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_updated_at ON "user";
DROP TRIGGER IF EXISTS update_credits_updated_at ON credits;

-- Triggers
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
