-- Migration for Total Traceability (Audit Triggers on All Tables)

-- 1. Ensure the handle_audit_log function is updated/robust
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

-- 2. Apply triggers to all relevant tables

-- Profiles
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- Projects
DROP TRIGGER IF EXISTS audit_projects ON public.projects;
CREATE TRIGGER audit_projects
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- Tasks
DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
CREATE TRIGGER audit_tasks
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- Room Bookings
DROP TRIGGER IF EXISTS audit_room_bookings ON public.room_bookings;
CREATE TRIGGER audit_room_bookings
AFTER INSERT OR UPDATE OR DELETE ON public.room_bookings
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- Medical Materials
DROP TRIGGER IF EXISTS audit_medical_materials ON public.medical_materials;
CREATE TRIGGER audit_medical_materials
AFTER INSERT OR UPDATE OR DELETE ON public.medical_materials
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- Medical Attachments
DROP TRIGGER IF EXISTS audit_medical_attachments ON public.medical_attachments;
CREATE TRIGGER audit_medical_attachments
AFTER INSERT OR UPDATE OR DELETE ON public.medical_attachments
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- Note: medical_requests and medical_procedures are already handled in migration_audit_logs.sql
