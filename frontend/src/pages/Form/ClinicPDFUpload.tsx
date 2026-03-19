import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinicContext } from '../../context/ClinicContext';
import { supabase } from '../../lib/supabase';
//import type { ClinicRow } from '../Dashboard/Clinic/ClinicADashBoard'

const ClinicPDFUpload: React.FC = () => {
    const { profile } = useAuth();
    const { selectedClinicId, setSelectedClinicId } = useClinicContext();
    const [file, setFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchPdfUrl = async () => {
            if (!selectedClinicId) return;
            const { data, error } = await supabase
                .from('clinics')
                .select('clinic_id')
                .eq('clinic_name', selectedClinicId)
                .eq('approved', true)
                .single();
            if (error || !data) {
                setPdfUrl(null);
                return;
            }
            const filePath = `${data.clinic_id}/form/clinic_form.pdf`;
            const { data : signedUrlData, error : signedUrlError } = await supabase.storage
                .from('clinic-forms')
                .createSignedUrl(filePath, 60 * 60); // 1小时

                if (!signedUrlError) {
                setPdfUrl(signedUrlData.signedUrl);
                }
        };
        fetchPdfUrl();
    }, [selectedClinicId]);

    if (!profile || profile.role !== 'nurse') {
        return <div>Only nurses can access this page.</div>;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedClinicId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('clinics')
            .select('clinic_id')
            .eq('clinic_name', selectedClinicId)
            .eq('approved', true)
            .single();
        if (error || !data) {
            alert('Clinic does not exist or is not approved.');
            setLoading(false);
            return;
        }
        const filePath = `${data.clinic_id}/form/clinic_form.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('clinic-forms')
            .upload(filePath, file, { upsert: true, contentType: 'application/pdf' });
        setLoading(false);
        if (uploadError) {
            alert('Upload failed: ' + uploadError.message);
        } else {
            const { publicUrl } = supabase.storage
                .from('clinic-forms')
                .getPublicUrl(filePath).data;
            setPdfUrl(publicUrl);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Upload Clinic PDF Form</h2>
            {/* File Upload */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select PDF File</label>
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="text-gray-600">
                        {file ? `Selected: ${file.name}` : "Click to upload PDF"}
                    </span>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>
            {/* Clinic ID */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Clinic ID:</label>
                <input
                    type="text"
                    value={selectedClinicId || ""}
                    onChange={(e) => setSelectedClinicId && setSelectedClinicId(e.target.value)}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring focus:border-blue-500"
                />
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
            {pdfUrl && (
                <div className="mt-6">
                    <h3 className="font-medium mb-2">PDF Preview:</h3>
                    <iframe
                        src={pdfUrl}
                        width="100%"
                        height="600px"
                        title="PDF preview"
                        className="border rounded"
                    />
                </div>
            )}
        </div>
    );
};

export default ClinicPDFUpload;
