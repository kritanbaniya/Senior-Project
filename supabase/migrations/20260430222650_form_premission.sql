CREATE POLICY "Only authorized staff can access patient forms"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-forms' 
  AND
  EXISTS (
    SELECT 1 
    FROM public.staff_permissions 
    WHERE staff_permissions.user_id = auth.uid()
      AND staff_permissions.manage_queue = true
  )
);