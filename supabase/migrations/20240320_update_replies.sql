-- Add is_nested column to replies table
ALTER TABLE replies 
ADD COLUMN IF NOT EXISTS is_nested BOOLEAN DEFAULT FALSE;

-- Add parent_reply_id column to support nested replies
ALTER TABLE replies 
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES replies(id);

-- Update RLS policies
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read replies"
ON replies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create replies"
ON replies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
ON replies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
ON replies FOR DELETE
TO authenticated
USING (auth.uid() = user_id);