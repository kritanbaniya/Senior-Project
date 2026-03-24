import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinicContext } from '../../context/ClinicContext';
import { supabase } from '../../lib/supabase';

const PatientPDFUpload: React.FC = () => {
  const { profile } = useAuth();
  const { selectedClinicId, setSelectedClinicId } = useClinicContext();
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [clinicPdfUrl, setClinicPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchClinics = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      const { data, error } = await supabase
        .from('membernamerole')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('role', 'patient');
      if (error) {
        console.error('Error fetching clinics:', error);
        return;
      }
      setClinics(data || []);
    };
    fetchClinics();
  }, []);

  React.useEffect(() => {
    const fetchPdfUrl = async () => {
      if (!selectedClinicId) return;
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('clinic_id')
        .eq('clinic_name', selectedClinicId)
        .eq('approved', true)
        .single();
      if (clinicError || !clinicData) {
        setPdfUrl(null);
        setClinicPdfUrl(null);
        return;
      }
      const clinicId = clinicData.clinic_id;
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      // Patient PDF
      const patientFilePath = `${clinicId}/${userId}/user_form.pdf`;
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('patient-forms')
        .createSignedUrl(patientFilePath, 60 * 60);
      if (!signedUrlError) {
        setPdfUrl(signedUrlData.signedUrl);
      } else {
        await supabase.storage
          .from('patient-forms')
          .upload(patientFilePath, new Blob([""], { type: 'application/pdf' }), { upsert: true, contentType: 'application/pdf' });
        const { data: newSignedUrlData, error: newSignedUrlError } = await supabase.storage
          .from('patient-forms')
          .createSignedUrl(patientFilePath, 60 * 60);
        if (!newSignedUrlError) setPdfUrl(newSignedUrlData.signedUrl);
      }
      // Clinic PDF
      const clinicFilePath = `${clinicId}/form/clinic_form.pdf`;
      const { data: clinicSignedUrlData, error: clinicSignedUrlError } = await supabase.storage
        .from('clinic-forms')
        .createSignedUrl(clinicFilePath, 60 * 60);
      if (!clinicSignedUrlError) {
        setClinicPdfUrl(clinicSignedUrlData.signedUrl);
      } else {
        setClinicPdfUrl(null);
      }
    };
    fetchPdfUrl();
  }, [selectedClinicId]);

  if (!profile || profile.role !== 'patient') {
    return <div>Only patients can access this page.</div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedClinicId) return;
    setLoading(true);
    // 查询数据库 clinic_id
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('clinic_id')
      .eq('clinic_name', selectedClinicId)
      .eq('approved', true)
      .single();
    if (clinicError || !clinicData) {
      alert('Clinic does not exist or is not approved.');
      setLoading(false);
      return;
    }
    const clinicId = clinicData.clinic_id;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      alert('No user ID');
      setLoading(false);
      return;
    }
    const filePath = `${clinicId}/${userId}/user_form.pdf`;
    const { error } = await supabase.storage
      .from('patient-forms')
      .upload(filePath, file, { upsert: true, contentType: 'application/pdf' });
    setLoading(false);
    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      const { data: newSignedUrlData, error: newSignedUrlError } = await supabase.storage
        .from('patient-forms')
        .createSignedUrl(filePath, 60 * 60);
      if (!newSignedUrlError) setPdfUrl(newSignedUrlData.signedUrl);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Upload PDF Form</h2>
      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select PDF File</label>
        <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
          <span className="text-gray-600">
            {file ? `Selected: ${file.name}` : "Click to upload a PDF"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
      {/* Clinic Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Clinic:</label>
        <select
          value={selectedClinicId || ""}
          onChange={(e) =>
            setSelectedClinicId && setSelectedClinicId(e.target.value)
          }
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring focus:border-blue-500"
        >
          <option value="">Select a clinic</option>
          {clinics.map((clinic) => (
            <option key={clinic.clinic_id} value={clinic.clinic_name}>
              {clinic.clinic_name}
            </option>
          ))}
        </select>
      </div>
      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Uploading..." : "Upload PDF"}
      </button>
      {/* Preview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient PDF */}
        {pdfUrl && (
          <div>
            <h3 className="font-medium mb-2">Your PDF:</h3>
            <iframe
              src={pdfUrl}
              width="100%"
              height="600px"
              title="Patient PDF preview"
              className="border rounded"
            />
          </div>
        )}
        {/* Clinic PDF */}
        {clinicPdfUrl && (
          <div>
            <h3 className="font-medium mb-2">Clinic PDF:</h3>
            <iframe
              src={clinicPdfUrl}
              width="100%"
              height="600px"
              title="Clinic PDF preview"
              className="border rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPDFUpload;
