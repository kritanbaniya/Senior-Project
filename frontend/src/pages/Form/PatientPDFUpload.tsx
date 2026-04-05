import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinicContext } from '../../context/ClinicContext';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, CheckCircle, Download, AlertCircle, Loader2 } from 'lucide-react'; // 建议安装 lucide-react 图标库
import { useLocation } from "react-router-dom";

const PatientPDFUpload: React.FC = () => {
  const { profile } = useAuth();
  const { selectedClinicId, setSelectedClinicId } = useClinicContext();
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [clinicPdfUrl, setClinicPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const location = useLocation();
  const defaultClinic = location.state?.clinicId;
  const isLockedClinic = !!defaultClinic;
  const selectedClinic = clinics.find(
    (c) => c.clinic_id == selectedClinicId
  );
  useEffect(() => {
    if (defaultClinic) {
      setSelectedClinicId(defaultClinic);
    }
  }, [defaultClinic, setSelectedClinicId]);
  // 获取诊所列表
  useEffect(() => {
    const fetchClinics = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      const { data } = await supabase
        .from('membernamerole')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('role', 'patient');
      setClinics(data || []);
    };
    fetchClinics();
  }, []);

  // 获取 PDF 预览链接
  useEffect(() => {
    const fetchPdfUrl = async () => {
      if (!selectedClinicId) return;
      setFetching(true);
      try {
        const { data: clinicData } = await supabase
          .from('clinics')
          .select('clinic_id')
          .eq('clinic_id', selectedClinicId)
          .eq('approved', true)
          .single();

        if (!clinicData) return;

        const clinicId = clinicData.clinic_id;
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;

        // 1. 获取诊所提供的空白表单 (供下载)
        const clinicFilePath = `${clinicId}/form/clinic_form.pdf`;
        const { data: clinicUrl } = await supabase.storage
          .from('clinic-forms')
          .createSignedUrl(clinicFilePath, 3600);
        setClinicPdfUrl(clinicUrl?.signedUrl || null);

        // 2. 获取用户已上传的表单 (供预览)
        const patientFilePath = `${clinicId}/${userId}/user_form.pdf`;
        const { data: patientUrl } = await supabase.storage
          .from('patient-forms')
          .createSignedUrl(patientFilePath, 3600);
        setPdfUrl(patientUrl?.signedUrl || null);
      } finally {
        setFetching(false);
      }
    };
    fetchPdfUrl();
  }, [selectedClinicId]);

  if (!profile || profile.role !== 'patient') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium">Access Denied. Only patients can access this page.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedClinicId) return;
    setLoading(true);
    try {
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('clinic_id')
        .eq('clinic_name', selectedClinicId)
        .single();

      const { data: userData } = await supabase.auth.getUser();
      const filePath = `${clinicData?.clinic_id}/${userData.user?.id}/user_form.pdf`;

      const { error } = await supabase.storage
        .from('patient-forms')
        .upload(filePath, file, { upsert: true, contentType: 'application/pdf' });

      if (error) throw error;

      setUploadSuccess(true);
      // 刷新预览
      const { data: newUrl } = await supabase.storage
        .from('patient-forms')
        .createSignedUrl(filePath, 3600);
      setPdfUrl(newUrl?.signedUrl || null);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medical Form Upload</h1>
        <p className="mt-2 text-gray-600">Please complete the clinic's form and upload it to join the queue.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">

            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">

              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">1</span>

              Select Clinic

            </label>



            {isLockedClinic ? (

              // ✅ 锁定状态（从别的页面进来）

              <div className="w-full py-2.5 px-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-medium">

                {selectedClinic?.clinic_name || "Loading clinic..."}

              </div>

            ) : (

              // ✅ 正常可选状态

              <select

                value={selectedClinicId || ""}

                onChange={(e) => setSelectedClinicId(e.target.value)}

                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"

              >

                <option value="">-- Choose a clinic --</option>

                {clinics.map((clinic) => (

                  <option key={clinic.clinic_id} value={clinic.clinic_id}>

                    {clinic.clinic_name}

                  </option>

                ))}

              </select>

            )}

          </div>

          {/* Step 2: Download Form */}
          {selectedClinicId && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">2</span>
                Download Template
              </label>
              {clinicPdfUrl ? (
                <a
                  href={clinicPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  <Download className="w-4 h-4 mr-2" /> Download Clinic Form
                </a>
              ) : (
                <p className="text-sm text-gray-500 italic text-center">No template available for this clinic.</p>
              )}
            </div>
          )}

          {/* Step 3: Upload */}
          <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${!selectedClinicId && 'opacity-50 pointer-events-none'}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">3</span>
              Upload Signed Form
            </label>

            <div className="group relative border-2 border-dashed border-gray-300 rounded-lg p-6 transition-all hover:border-blue-400 text-center">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
              <p className="text-sm text-gray-600">
                {file ? <span className="font-medium text-blue-600">{file.name}</span> : "Click or drag PDF here"}
              </p>
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-blue-200 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
              {loading ? "Uploading..." : "Submit My Form"}
            </button>

            {uploadSuccess && (
              <p className="mt-3 text-sm text-green-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Uploaded successfully!
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Document Preview
              </h3>
              {fetching && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            </div>

            <div className="flex-grow bg-gray-200 relative">
              {!selectedClinicId ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">🏥</div>
                  <p>Select a clinic to view documents</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                  <FileText className="w-12 h-12 mb-2 opacity-20" />
                  <p>No document uploaded yet for this clinic.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPDFUpload;