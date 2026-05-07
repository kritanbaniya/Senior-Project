import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PatientFormView: React.FC = () => {
  const { patientId, clinicId } = useParams<{ patientId: string; clinicId: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPdfUrl = async () => {
      if (!patientId || !clinicId) return;
      setLoading(true);
      const patientFilePath = `${clinicId}/${patientId}/user_form.pdf`;
      const { data: patientUrl } = await supabase.storage
        .from('patient-forms')
        .createSignedUrl(patientFilePath, 3600);
      setPdfUrl(patientUrl?.signedUrl || null);
      setLoading(false);
    };
    fetchPdfUrl();
  }, [patientId, clinicId]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">patient form</h1>
      {loading ? (
        <div>loading...</div>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          title="Patient Form PDF"
          width="100%"
          height="700px"
          style={{ border: '1px solid #ccc', borderRadius: 8 }}
        />
      ) : (
        <div>form unfound</div>
      )}
    </div>
  );
};

export default PatientFormView;
