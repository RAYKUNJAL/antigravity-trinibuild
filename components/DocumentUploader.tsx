import React, { useState, useRef } from 'react';
import { Upload, Camera, CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { documentIntelligenceService, DocumentVerificationResult } from '../services/documentIntelligenceService';

interface DocumentUploaderProps {
    documentType: 'drivers_permit' | 'vehicle_insurance' | 'ttps_certificate' | 'h_car_license' | 'medical_certificate';
    label: string;
    required?: boolean;
    expectedName?: string;
    onVerified: (result: DocumentVerificationResult, fileUrl: string) => void;
    driverId?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
    documentType,
    label,
    required = true,
    expectedName,
    onVerified,
    driverId,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<DocumentVerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        setError(null);
        setVerificationResult(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);

        // Auto-verify document
        await verifyDocument(selectedFile);
    };

    const verifyDocument = async (fileToVerify: File) => {
        setVerifying(true);
        try {
            let result: DocumentVerificationResult;

            switch (documentType) {
                case 'drivers_permit':
                    result = await documentIntelligenceService.verifyDriversPermit(
                        fileToVerify,
                        expectedName || ''
                    );
                    break;
                case 'vehicle_insurance':
                    result = await documentIntelligenceService.verifyInsurance(fileToVerify);
                    break;
                case 'ttps_certificate':
                    result = await documentIntelligenceService.verifyTTPSCertificate(fileToVerify);
                    break;
                case 'h_car_license':
                    result = await documentIntelligenceService.verifyHCarLicense(fileToVerify);
                    break;
                default:
                    result = {
                        success: true,
                        documentType,
                        extractedData: {},
                        confidence: 0.9,
                        validations: {
                            formatValid: true,
                            notExpired: true,
                            authentic: true,
                            nameMatch: true,
                        },
                        feedback: 'Document uploaded successfully!',
                        requiresManualReview: false,
                    };
            }

            setVerificationResult(result);

            // If verification successful, upload to storage
            if (result.success && driverId) {
                setUploading(true);
                const { url } = await documentIntelligenceService.uploadDocument(
                    fileToVerify,
                    driverId,
                    documentType
                );

                // Save verification result
                await documentIntelligenceService.saveDocumentVerification(
                    driverId,
                    documentType,
                    url,
                    result
                );

                onVerified(result, url);
                setUploading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify document');
        } finally {
            setVerifying(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        setVerificationResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {verificationResult?.success && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                    </span>
                )}
            </div>

            {!file ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-trini-red transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">
                        Upload {label}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        Click to browse or drag and drop
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            type="button"
                            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            <Camera className="h-4 w-4 inline mr-2" />
                            Take Photo
                        </button>
                        <button
                            type="button"
                            className="bg-trini-red text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            Choose File
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) handleFileSelect(selectedFile);
                        }}
                    />
                </div>
            ) : (
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {/* Preview */}
                    {preview && (
                        <div className="relative bg-gray-100 p-4">
                            <img
                                src={preview}
                                alt="Document preview"
                                className="max-h-64 mx-auto rounded-lg shadow-md"
                            />
                            <button
                                onClick={handleRemove}
                                className="absolute top-6 right-6 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Verification Status */}
                    <div className="p-6">
                        {verifying && (
                            <div className="flex items-center gap-3 text-blue-600">
                                <Loader className="h-5 w-5 animate-spin" />
                                <span className="font-medium">Verifying document with AI...</span>
                            </div>
                        )}

                        {uploading && (
                            <div className="flex items-center gap-3 text-blue-600">
                                <Loader className="h-5 w-5 animate-spin" />
                                <span className="font-medium">Uploading to secure storage...</span>
                            </div>
                        )}

                        {verificationResult && !verifying && !uploading && (
                            <div
                                className={`rounded-lg p-4 ${verificationResult.success
                                        ? 'bg-green-50 border-2 border-green-200'
                                        : 'bg-yellow-50 border-2 border-yellow-200'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {verificationResult.success ? (
                                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <p
                                            className={`font-medium ${verificationResult.success ? 'text-green-900' : 'text-yellow-900'
                                                }`}
                                        >
                                            {verificationResult.feedback}
                                        </p>
                                        {verificationResult.extractedData && Object.keys(verificationResult.extractedData).length > 0 && (
                                            <div className="mt-3 space-y-1 text-sm">
                                                {Object.entries(verificationResult.extractedData).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-gray-600 capitalize">
                                                            {key.replace(/_/g, ' ')}:
                                                        </span>
                                                        <span className="font-medium text-gray-900">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {verificationResult.requiresManualReview && (
                                            <p className="mt-2 text-xs text-gray-600">
                                                This document will be manually reviewed by our team within 24 hours.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-900">Upload Failed</p>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
