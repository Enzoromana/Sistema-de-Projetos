-- Add sector column to room_bookings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'room_bookings' AND column_name = 'sector') THEN
        ALTER TABLE public.room_bookings ADD COLUMN sector text;
    END IF;
END $$;
