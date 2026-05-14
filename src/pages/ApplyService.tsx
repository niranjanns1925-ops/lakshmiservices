import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Service } from './Services';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { Upload, X, FileText, ChevronRight, IndianRupee } from 'lucide-react';
import { processPayment } from '../utils/payment';

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
    const fetchService = async () => {
      try {
        if (!serviceId) return;
        const docRef = doc(db, 'services', serviceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() } as Service);
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
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`File size must be less than 2MB. ${file.name} is too large.`);
        setDocsMeta(prev => ({
          ...prev, 
          [documentName]: { file: prev[documentName]?.file || null, status: 'error', progress: 0, error: `File size exceeds 2MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB).` }
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
    
    try {
      // 1. Upload files to Firebase Storage
      const uploadPromises = Object.entries(docsMeta)
        .filter(([_, meta]) => (meta as any).file)
        .map(([docName, meta]) => {
          return new Promise<{ docName: string, url: string }>((resolve, reject) => {
            const file = (meta as any).file!;
            setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], status: 'uploading', progress: 0, error: null } }));

            const fileExt = file.name.split('.').pop();
            const fileName = `applications/${user?.uid}/${service.id}_${Date.now()}_${docName.replace(/\s+/g, '_')}.${fileExt}`;
            const storageRef = ref(storage, fileName);
            
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            uploadTask.on('state_changed',
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], progress } }));
              },
              (error) => {
                let errorMessage = error.message;
                if (error.code === 'storage/unauthorized') errorMessage = 'Permission denied. Check storage rules.';
                setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], status: 'error', error: errorMessage } }));
                reject(new Error(`Failed to upload ${docName}: ${errorMessage}`));
              },
              async () => {
                try {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], status: 'success', progress: 100 } }));
                  resolve({ docName, url: downloadURL });
                } catch (err: any) {
                  setDocsMeta(prev => ({ ...prev, [docName]: { ...prev[docName], status: 'error', error: 'Failed to get download URL' } }));
                  reject(err);
                }
              }
            );
          });
        });

      const results = await Promise.all(uploadPromises);
      const uploadedDocs: Record<string, string> = {};
      results.forEach(r => { uploadedDocs[r.docName] = r.url; });
      setUploading(false);

      // 2. Process Payment via Live Cashfree
      const customerPhone = formData.applicantPhone ? formData.applicantPhone.replace(/\D/g, '') : "9999999999";
      
      await processPayment(
        'cashfree',
        {
          orderId: `ORD_${Date.now()}`,
          amount: service.price,
          customerName: formData.applicantName || user?.displayName || 'Applicant',
          customerEmail: user?.email || 'test@example.com',
          customerPhone: customerPhone.length > 0 ? customerPhone : '9999999999'
        },
        async (transactionId) => {
           // 3. On success, create the application record in Firestore
           try {
             await addDoc(collection(db, 'applications'), {
               userId: user?.uid,
               userEmail: user?.email,
               serviceId: service.id,
               serviceName: service.title,
               applicantDetails: { ...formData, ...customData },
               documents: uploadedDocs,
               status: 'Submitted',
               paymentStatus: 'Paid',
               transactionId,
               fee: service.price,
               createdAt: serverTimestamp(),
               updatedAt: serverTimestamp()
             });
             
             toast.success('Application submitted successfully!');
             navigate('/dashboard');
           } catch(err: any) {
             console.error("Firestore save error after payment:", err);
             toast.error("Payment successful, but failed to save application. Please contact support.", { duration: 6000 });
           }
        },
        (paymentError) => {
          console.error("Payment Error:", paymentError);
          toast.error(paymentError?.message || "Payment Process Failed.");
        }
      );

    } catch (err: any) {
      console.error("Submission error:", err);
      
      let errorMessage = 'Application creation failed. Please try again.';
      if (err.code === 'storage/retry-limit-exceeded' || err.code === 'storage/unauthorized') {
        errorMessage = 'Document upload failed. Please connect to a stable network or try again later.';
      } else if (err.code === 'permission-denied') {
        errorMessage = 'You do not have permission to submit. Please ensure you are logged in properly.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setErrors({ global: errorMessage });
      toast.error(errorMessage);
      setUploading(false);
    }
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
            <IndianRupee className="w-6 h-6 mr-1" />
            {service.price}
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
                    <p className={`text-xs ${hasError ? 'text-red-500' : 'text-gray-500'}`}>Supported: JPG, PNG, PDF (Max 2MB)</p>
                    {hasError && meta.error && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{meta.error}</p>
                    )}
                    {meta.status === 'uploading' && (
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${meta.progress}%` }}></div>
                      </div>
                    )}
                    {meta.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1 font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> Uploaded Successfully
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 mt-3 sm:mt-0">
                    {meta.file ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center bg-white border border-gray-200 px-3 py-2 rounded-md text-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500">
                          <span className="truncate max-w-[150px] text-gray-700 font-medium">{meta.file.name}</span>
                          {meta.status !== 'uploading' && meta.status !== 'success' && (
                            <button type="button" onClick={() => handleRemoveFile(docName)} className="ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors" disabled={uploading}>
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {meta.status === 'uploading' && <span className="text-xs text-primary-600 mt-1 font-medium">{meta.progress}% Uploading...</span>}
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
