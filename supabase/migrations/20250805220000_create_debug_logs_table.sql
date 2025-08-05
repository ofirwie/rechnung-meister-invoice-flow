-- Create debug_logs table for comprehensive application debugging
CREATE TABLE debug_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  component TEXT NOT NULL,
  action TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('trace', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context JSONB,
  stack_trace TEXT,
  url TEXT,
  user_agent TEXT
);

-- Create index for efficient querying
CREATE INDEX idx_debug_logs_session_created ON debug_logs(session_id, created_at DESC);
CREATE INDEX idx_debug_logs_user_created ON debug_logs(user_id, created_at DESC);
CREATE INDEX idx_debug_logs_component_action ON debug_logs(component, action);
CREATE INDEX idx_debug_logs_level ON debug_logs(level);

-- Enable RLS
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own logs and insert new logs
CREATE POLICY "Users can view their own debug logs" ON debug_logs
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert debug logs" ON debug_logs
  FOR INSERT WITH CHECK (true);

-- Allow admins to view all logs (optional)
CREATE POLICY "Admins can view all debug logs" ON debug_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );
