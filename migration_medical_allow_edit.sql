-- Add column to allow re-editing of tiebreaker opinions
ALTER TABLE medical_requests ADD COLUMN IF NOT EXISTS tiebreaker_allow_edit BOOLEAN DEFAULT FALSE;

-- Update the view/RPC if necessary to include the new column
-- (Assuming the existing RPC 'get_tiebreaker_request_by_token' returns all columns or needs update)
