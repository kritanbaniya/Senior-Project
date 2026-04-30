import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinicContext } from '../../context/ClinicContext';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Hospital } from 'lucide-react';

const ClinicPDFUpload: React.FC = () => {
    const { profile } = useAuth();
    const { selectedClinicId, setSelectedClinicId } = useClinicContext();
    const [file, setFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [clinics, setClinics] = useState<any[]>([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // 获取护士所属的诊所列表
    useEffect(() => {
        const fetchClinics = async () => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData?.user?.id) return;
            const { data } = await supabase
                .from('membernamerole')
                .select('*')
                .eq('user_id', userData.user.id)
                .eq('role', 'nurse');
            setClinics(data || []);
        };
        fetchClinics();
    }, []);

    useEffect(() => {
        const fetchPdfUrl = async () => {
            if (!selectedClinicId) return;
            setFetching(true);
            try {
                const { data: clinicData } = await supabase
                    .from('clinics')
                    .select('clinic_id')
                    .eq('clinic_name', selectedClinicId)
                    .eq('approved', true)
                    .single();

                if (!clinicData) {
                    setPdfUrl(null);
                    return;
                }

                const filePath = `${clinicData.clinic_id}/form/clinic_form.pdf`;
                const { data: signedUrlData } = await supabase.storage
                    .from('clinic-forms')
                    .createSignedUrl(filePath, 3600);

                setPdfUrl(signedUrlData?.signedUrl || null);
            } finally {
                setFetching(false);
            }
        };
        fetchPdfUrl();
    }, [selectedClinicId]);

    if (!profile || profile.role !== 'nurse') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-amber-700 font-medium">Nurse access required to manage clinic forms.</p>
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
                .eq('approved', true)
                .single();

            if (!clinicData) throw new Error('Clinic not found or not approved.');

            const filePath = `${clinicData.clinic_id}/form/clinic_form.pdf`;
            const { error: uploadError } = await supabase.storage
                .from('clinic-forms')
                .upload(filePath, file, { upsert: true, contentType: 'application/pdf' });

            if (uploadError) throw uploadError;

            setUploadSuccess(true);
            
            const { data: newUrl } = await supabase.storage
                .from('clinic-forms')
                .createSignedUrl(filePath, 3600);
            setPdfUrl(newUrl?.signedUrl || null);
            setFile(null); 
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
return (
  <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center">
        <Hospital className="w-7 h-7 mr-2 text-blue-600" />
        Clinic Form Management
      </h1>
      <p className="mt-2 text-gray-600">
        Upload and manage the official form template for patients.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-6">

        {/* Step 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
              1
            </span>
            Select Clinic
          </label>

          <select
            value={selectedClinicId || ""}
            onChange={(e) => setSelectedClinicId && setSelectedClinicId(e.target.value)}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
          >
            <option value="">-- Choose a clinic --</option>
            {clinics.map((clinic) => (
              <option key={clinic.clinic_id} value={clinic.clinic_name}>
                {clinic.clinic_name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2 */}
        <div
          className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${
            !selectedClinicId && "opacity-50 pointer-events-none"
          }`}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
              2
            </span>
            Upload Template
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
              {file ? (
                <span className="font-medium text-blue-600">{file.name}</span>
              ) : (
                "Click or drag PDF here"
              )}
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-blue-200 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {loading ? "Uploading..." : "Publish Template"}
          </button>

          {uploadSuccess && (
            <p className="mt-3 text-sm text-green-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Template updated successfully!
            </p>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full min-h-[600px] flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Template Preview
            </h3>
            {fetching && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-grow bg-gray-200 relative">
            {!selectedClinicId ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                  🏥
                </div>
                <p>Select a clinic to view template</p>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="Template Preview"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                <FileText className="w-12 h-12 mb-2 opacity-20" />
                <p>No template uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ClinicPDFUpload;