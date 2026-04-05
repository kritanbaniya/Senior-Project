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

    // 获取当前诊所已有的模版预览
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
            
            // 重新获取链接以刷新预览
            const { data: newUrl } = await supabase.storage
                .from('clinic-forms')
                .createSignedUrl(filePath, 3600);
            setPdfUrl(newUrl?.signedUrl || null);
            setFile(null); // 清除已选文件
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Hospital className="text-blue-600" /> Clinic Form Management
                    </h1>
                    <p className="mt-1 text-gray-500">Upload the master PDF template that patients need to fill out.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Actions */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Step 1: Clinic Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center italic">
                            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 text-[10px] not-italic">1</span>
                            Current Clinic
                        </label>
                        <select
                            value={selectedClinicId || ""}
                            onChange={(e) => setSelectedClinicId && setSelectedClinicId(e.target.value)}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">-- Select Clinic --</option>
                            {clinics.map((clinic) => (
                                <option key={clinic.clinic_id} value={clinic.clinic_name}>
                                    {clinic.clinic_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: Upload Action */}
                    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-opacity ${!selectedClinicId && 'opacity-50 pointer-events-none'}`}>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center italic">
                            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 text-[10px] not-italic">2</span>
                            Update Template
                        </label>
                        
                        <div className="group relative border-2 border-dashed border-gray-200 rounded-xl p-8 transition-all hover:border-blue-400 text-center bg-gray-50/50">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {file ? (
                                    <span className="font-medium text-blue-600">{file.name}</span>
                                ) : (
                                    "Drop new master form here or click to browse"
                                )}
                            </p>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            className="w-full mt-5 bg-gray-900 hover:bg-black text-white font-medium py-3 px-4 rounded-lg shadow-md disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                            {loading ? "Processing..." : "Publish Template"}
                        </button>

                        {uploadSuccess && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center text-green-700 text-sm">
                                <CheckCircle className="w-4 h-4 mr-2" /> Live template updated!
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Preview */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full min-h-[650px] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Master Template Preview</h3>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Active Document</p>
                                </div>
                            </div>
                            {fetching && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                        </div>
                        
                        <div className="flex-grow bg-[#525659] flex items-center justify-center relative">
                            {!selectedClinicId ? (
                                <div className="text-center text-gray-400 bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
                                    <Hospital className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">Select a clinic to view the current form</p>
                                </div>
                            ) : pdfUrl ? (
                                <iframe
                                    src={`${pdfUrl}#view=FitH&toolbar=0`}
                                    className="w-full h-full border-none shadow-2xl"
                                    title="Clinic Template Preview"
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-30" />
                                    <p className="text-gray-300">No template has been uploaded for this clinic yet.</p>
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