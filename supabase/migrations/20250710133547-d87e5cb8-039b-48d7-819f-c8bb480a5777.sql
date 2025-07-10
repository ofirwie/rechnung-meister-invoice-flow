-- Step 1: Add soft delete support to invoices table
ALTER TABLE public.invoices 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Step 2: Create audit_logs table for tracking sensitive actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  additional_info JSONB
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs (only admins should see these)
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Step 3: Create function to log invoice actions
CREATE OR REPLACE FUNCTION public.log_invoice_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the action
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at,
    additional_info
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.invoice_number, OLD.invoice_number),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    now(),
    jsonb_build_object(
      'trigger_name', TG_NAME,
      'operation', TG_OP,
      'when', TG_WHEN,
      'level', TG_LEVEL
    )
  );
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for audit logging on invoices
CREATE TRIGGER audit_invoices_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.log_invoice_action();

-- Step 5: Create function to prevent deletion of approved/issued invoices
CREATE OR REPLACE FUNCTION public.prevent_invoice_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if invoice status is approved or issued
  IF OLD.status IN ('approved', 'issued') THEN
    RAISE EXCEPTION 'אסור למחוק חשבוניות שאושרו או הונפקו. זהו הפרה של חוקי הנהלת חשבונות! / Cannot delete approved or issued invoices. This violates accounting regulations!'
      USING ERRCODE = 'P0001',
            HINT = 'רק חשבוניות עם סטטוס draft ניתנות למחיקה / Only invoices with draft status can be deleted';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to prevent deletion of approved/issued invoices
CREATE TRIGGER prevent_invoice_deletion_trigger
  BEFORE DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_invoice_deletion();

-- Step 7: Update existing queries to exclude soft-deleted invoices by adding WHERE deleted_at IS NULL
-- This will be handled in the application code

-- Step 8: Create index for performance on deleted_at column
CREATE INDEX idx_invoices_deleted_at ON public.invoices(deleted_at);

-- Step 9: Create index for audit logs performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);