import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../context/AuthContext';
import { Service } from './Services';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { FileText, Upload, X, ChevronRight } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function ApplyService() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [docsMeta, setDocsMeta] = useState<Record<string, { file: File | null; status: 'idle' | 'uploading' | 'success' | 'error'; progress: number; error: string | null }>>({});
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    applicantName: appUser?.name || '',
    applicantPhone: appUser?.phone || '',
    applicantAadhaar: '',
    address: ''
  });
  const [customData, setCustomData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (appUser) {
      setFormData(prev => ({
        ...prev,
        applicantName: prev.applicantName || appUser.name || '',
        applicantPhone: prev.applicantPhone || appUser.phone || '',
      }));
    }
  }, [appUser]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        if (!serviceId) return;
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .single();
          
        if (data) {
          setService(data as Service);
        } else {
          // Fallback logic for demo preview if Firestore is unpopulated
          if (serviceId === '1') setService({ id: '1', title: 'PAN Card Application', description: 'Apply for a new Permanent Account Number.', price: 200, requiredDocuments: ['Aadhaar Card', 'Passport Photo', 'Signature'], active: true, category: 'Identity' });
          if (serviceId === '2') setService({ id: '2', title: 'Community Certificate', description: 'Apply for BC/MBC/SC/ST Community Certificate.', price: 150, requiredDocuments: ['Aadhaar', 'Ration Card', 'TC / Parent Certificate', 'Photo'], active: true, category: 'Revenue' });
          if (serviceId === '3') setService({ id: '3', title: 'Income Certificate', description: 'Get income certificate for scholarships and schemes.', price: 100, requiredDocuments: ['Aadhaar', 'Salary Slip/Affidavit', 'Ration Card'], active: true, category: 'Revenue' });
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const handleFileChange = (documentName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type. Only JPG, PNG, and PDF are allowed.`);
        setDocsMeta(prev => ({
          ...prev, 
          [documentName]: { file: null, status: 'error', progress: 0, error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' }
        }));
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File too large. Maximum size is 50MB.`);
        setDocsMeta(prev => ({
          ...prev, 
          [documentName]: { file: null, status: 'error', progress: 0, error: 'File too large. Maximum size is 50MB.' }
        }));
        return;
      }
      setDocsMeta(prev => ({
        ...prev, 
        [documentName]: { file, status: 'idle', progress: 0, error: null }
      }));
    }
  };

  const handleRemoveFile = (documentName: string) => {
    setDocsMeta(prev => {
      const newMeta = { ...prev };
      delete newMeta[documentName];
      return newMeta;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service) return;
    
    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.applicantName.trim()) {
      newErrors.applicantName = "Full Name is required.";
    }
    
    if (!formData.applicantPhone.trim()) {
      newErrors.applicantPhone = "Phone Number is required.";
    } else {
      const digits = formData.applicantPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        newErrors.applicantPhone = "Please enter a valid phone number (10 digits minimum).";
      }
    }
    
    if (!formData.applicantAadhaar.trim()) {
      newErrors.applicantAadhaar = "Aadhaar Number is required.";
    } else if (!/^\d{12}$/.test(formData.applicantAadhaar.replace(/\D/g, ''))) {
      newErrors.applicantAadhaar = "Please enter a valid 12-digit Aadhaar number.";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Full Address is required.";
    }

    if (service.customFields) {
      service.customFields.forEach(field => {
        if (field.required && !customData[field.name]) {
          newErrors[field.name] = `Please fill out the ${field.label || field.name} field.`;
        }
      });
    }

    const missingDocs = service.requiredDocuments.filter(doc => !docsMeta[doc]?.file);
    if (missingDocs.length > 0) {
      newErrors.documents = `Please upload: ${missingDocs.join(', ')}`;
      setDocsMeta(prev => {
        const next = { ...prev };
        missingDocs.forEach(doc => {
          if (!next[doc]) {
            next[doc] = { file: null, status: 'error', progress: 0, error: 'This document is missing and required.' };
          } else {
            next[doc] = { ...next[doc], status: 'error', error: 'This document is missing and required.' };
          }
        });
        return next;
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(`Validation Error: ${firstError}`);
      return;
    }

    setUploading(true);

    const onPaymentSuccess = async (transactionId: string) => {
      try {
        // 1. Upload files to Supabase Storage
        const uploadPromises = Object.entries(docsMeta)
          .filter(([_, meta]) => (meta as any).file)
          .map(([docName, meta]) => {
            return new Promise<{ docName: string, url: string }>(async (resolve, reject) => {
              let file = (meta as any).file!;
              setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], status: 'uploading', progress: 0, error: null } }));

              if (file.type.startsWith('image/')) {
                try {
                  const options = {
                    maxSizeMB: 2,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                  };
                  file = await imageCompression(file, options);
                } catch (error) {
                  console.error("Compression missed", error);
                }
              }

              const fileExt = file.name.split('.').pop();
              const fileName = `applications/${user?.id}/${service.id}_${Date.now()}_${docName.replace(/\s+/g, '_')}.${fileExt}`;
              
              setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], progress: 50 } }));

              try {
                const { data, error } = await supabase.storage
                  .from('applications')
                  .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (error) throw error;

                const { data: publicUrlData } = supabase.storage
                  .from('applications')
                  .getPublicUrl(fileName);

                const url = publicUrlData.publicUrl;

                setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], status: 'success', progress: 100 } }));
                resolve({ docName, url });
              } catch (error: any) {
                console.error("Upload failed", error);
                const errMsg = error.message && error.message.includes('too large') ? 'File too large. Please upload a smaller file.' : (error.message || 'Upload failed, please retry');
                setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], status: 'error', error: errMsg } }));
                reject(new Error(`Failed to upload ${docName}: ${errMsg}`));
              }
            });
          });

        const results = await Promise.all(uploadPromises);
        const uploadedDocs: Record<string, string> = {};
        results.forEach(r => { uploadedDocs[r.docName] = r.url; });

        try {
          const { error: dbError } = await supabase
            .from('applications')
            .insert({
              userId: user?.id,
              userEmail: user?.email,
              serviceId: service.id,
              serviceName: service.title,
              applicantDetails: { ...formData, ...customData },
              documents: uploadedDocs,
              status: 'Submitted',
              paymentStatus: transactionId.startsWith('FREE_') ? 'Free Bypass' : 'Paid',
              transactionId: transactionId,
              fee: service.price,
            });
          
          if (dbError) throw dbError;
          
          toast.success('Application submitted successfully!');
          navigate('/dashboard');
        } catch(err: any) {
          console.error("Supabase save error after payment:", err);
          toast.error("Failed to save application. Please contact support.", { duration: 6000 });
        }
      } catch (err: any) {
        console.error("Submission error:", err);
        
        let errorMessage = 'Application creation failed. Please try again.';
        if (err.message && err.message.toLowerCase().includes('storage')) {
          errorMessage = 'Document upload failed. Please connect to a stable network or try again later.';
        } else if (err.code === 'permission-denied') {
          errorMessage = 'You do not have permission to submit. Please ensure you are logged in properly.';
        } else if (err.message) {
          errorMessage = err.message;
        }

        setErrors({ global: errorMessage });
        toast.error(errorMessage);
      } finally {
        setUploading(false);
      }
    };

      // Payment bypassed
      onPaymentSuccess(`FREE_${Date.now()}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  if (!service) return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">Service not found.</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="hover:text-primary-600 cursor-pointer" onClick={() => navigate('/services')}>Services</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{service.title}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{service.title} Application</h1>
        <p className="text-gray-500 mt-2">{service.description}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="flex justify-between items-center bg-primary-50 p-4 rounded-lg">
          <div>
            <h3 className="font-semibold text-primary-900">Application Fee</h3>
            <p className="text-sm text-primary-700">Non-refundable processing fee</p>
          </div>
          <div className="text-2xl font-bold text-primary-700 flex items-center">
            ₹{service.price}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Applicant Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Applicant Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Full Name (as per records)" 
              name="applicantName"
              value={formData.applicantName}
              onChange={handleInputChange}
              error={errors.applicantName}
              required
            />
            <Input 
              label="Phone Number" 
              name="applicantPhone"
              value={formData.applicantPhone}
              onChange={handleInputChange}
              error={errors.applicantPhone}
              required
            />
            <Input 
              label="Aadhaar Number" 
              name="applicantAadhaar"
              placeholder="1234 5678 9012"
              value={formData.applicantAadhaar}
              onChange={handleInputChange}
              error={errors.applicantAadhaar}
              required
            />
            {/* Dynamic Custom Fields */}
            {service.customFields?.map(field => (
              <Input
                key={field.name}
                label={field.label || field.name}
                type={field.type}
                name={field.name}
                value={customData[field.name] || ''}
                onChange={handleCustomChange}
                error={errors[field.name]}
                required={field.required}
              />
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <textarea 
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={3}
              className={`w-full rounded-md border ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2`}
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
          </div>
        </div>

        {/* Document Uploads */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Required Documents</h2>
          <div className="space-y-4">
            {service.requiredDocuments.map((docName, idx) => {
              const meta = docsMeta[docName] || { file: null, status: 'idle', progress: 0, error: null };
              const hasError = meta.status === 'error' || (errors.documents && !meta.file);
              
              return (
                <div key={idx} className={`border ${hasError ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 bg-slate-50'} rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between`}>
                  <div className="mb-2 sm:mb-0 w-full sm:w-1/2">
                    <h4 className={`font-medium flex items-center ${hasError ? 'text-red-700' : 'text-gray-900'}`}>
                      <FileText className={`w-4 h-4 mr-2 ${hasError ? 'text-red-500' : 'text-gray-500'}`} />
                      {docName}
                      <span className="text-red-500 ml-1">*</span>
                    </h4>
                    <p className={`text-xs ${hasError ? 'text-red-500' : 'text-gray-500'}`}>Supported: JPG, PNG, PDF (Max 50MB) - Completely Free Storage</p>
                    {hasError && meta.error && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{meta.error}</p>
                    )}
                    {(meta.status === 'uploading' || meta.status === 'success') && (
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${meta.status === 'success' ? 'bg-green-500' : 'bg-primary-600'}`} 
                          style={{ width: `${meta.progress || 0}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 mt-3 sm:mt-0 flex flex-col items-end">
                    {meta.file ? (
                      <div className="flex flex-col items-end">
                        <div className={`flex items-center bg-white border py-2 px-3 rounded-md text-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500 ${meta.status === 'success' ? 'border-green-200 bg-green-50 text-green-800' : meta.status === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200'}`}>
                          <span className="truncate max-w-[150px] font-medium mr-2">{meta.file.name}</span>
                          {meta.status !== 'uploading' && meta.status !== 'success' && (
                            <button type="button" onClick={() => handleRemoveFile(docName)} className="text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full p-1 transition-colors flex-shrink-0" disabled={uploading}>
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {meta.status === 'uploading' && (
                          <span className="text-xs text-primary-600 mt-1.5 font-semibold tracking-wide animate-pulse">{meta.progress || 0}% Uploading...</span>
                        )}
                        {meta.status === 'success' && (
                          <span className="text-xs text-green-600 mt-1.5 font-semibold tracking-wide flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span> Uploaded
                          </span>
                        )}
                      </div>
                    ) : (
                      <label className={`cursor-pointer inline-flex items-center px-4 py-2 border ${hasError ? 'border-red-600 text-red-600 hover:bg-red-50' : 'border-primary-600 text-primary-600 hover:bg-primary-50'} text-sm font-medium rounded-md bg-white transition-colors`}>
                        <Upload className="w-4 h-4 mr-2" />
                        Select File
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange(docName, e)}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.documents && (
            <p className="mt-3 text-sm text-red-600 font-medium">{errors.documents}</p>
          )}
        </div>

        {errors.global && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errors.global}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={uploading}>
            {uploading ? 'Processing...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
}
