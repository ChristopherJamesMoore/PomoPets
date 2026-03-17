-- Create the support_tickets table for the contact/ticketing system
CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email          TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('query', 'issue', 'recommendation')),
  subject        TEXT NOT NULL,
  message        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Allow anyone to insert (public contact form)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a ticket"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read/update (admin)
CREATE POLICY "Authenticated users can read tickets"
  ON support_tickets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tickets"
  ON support_tickets FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_support_ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_timestamp();
