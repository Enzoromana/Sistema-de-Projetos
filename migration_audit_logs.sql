-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Admins view all, users view none or own?)
-- For now, let's allow insert by system (triggers) and view by admin only via policy later.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Function to handle audit logging
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (current_user_id, 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (current_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (current_user_id, 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on medical_requests
DROP TRIGGER IF EXISTS audit_medical_requests ON public.medical_requests;
CREATE TRIGGER audit_medical_requests
AFTER INSERT OR UPDATE OR DELETE ON public.medical_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- Trigger on medical_procedures (Optional, but good for completeness)
DROP TRIGGER IF EXISTS audit_medical_procedures ON public.medical_procedures;
CREATE TRIGGER audit_medical_procedures
AFTER INSERT OR UPDATE OR DELETE ON public.medical_procedures
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
