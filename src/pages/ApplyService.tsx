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
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [uploading, setUploading] = useState(false);
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
      setFiles({ ...files, [documentName]: e.target.files[0] });
    }
  };

  const handleRemoveFile = (documentName: string) => {
    const newFiles = { ...files };
    delete newFiles[documentName];
    setFiles(newFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service) return;
    
    // Validation
    const missingDocs = service.requiredDocuments.filter(doc => !files[doc]);
    if (missingDocs.length > 0) {
      toast.error(`Please upload all required documents: ${missingDocs.join(', ')}`);
      return;
    }
    
    if (!formData.applicantAadhaar || formData.applicantAadhaar.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (service.customFields) {
      for (const field of service.customFields) {
        if (field.required && !customData[field.name]) {
          toast.error(`Please fill out the ${field.label || field.name} field.`);
          return;
        }
      }
    }

    setUploading(true);
    
    try {
      const orderId = `order_${Date.now()}`;
      
      // Call mock payment gateway BEFORE generating application records and uploading huge files
      await processPayment(
        'cashfree',
        {
          orderId,
          amount: service.price,
          customerName: formData.applicantName,
          customerEmail: user?.email || '',
          customerPhone: formData.applicantPhone
        },
        async (transactionId) => {
          // Continue application submission on successful payment
          try {
            // 1. Upload files concurrently
            const uploadedDocs: Record<string, string> = {};
            const uploadPromises = Object.entries(files).map(async ([docName, file]) => {
              const fileExt = (file as File).name.split('.').pop();
              const fileName = `applications/${user?.uid}/${serviceId}_${Date.now()}_${docName.replace(/\s+/g, '_')}.${fileExt}`;
              const storageRef = ref(storage, fileName);
              
              const uploadTask = await uploadBytesResumable(storageRef, file as File);
              const downloadURL = await getDownloadURL(uploadTask.ref);
              uploadedDocs[docName] = downloadURL;
            });
            
            await Promise.all(uploadPromises);
            
            // 2. Create application record
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
            
            toast.success('Payment successful & Application submitted!');
            navigate('/dashboard');
          } catch (err: any) {
            console.error("Submission error after payment:", err);
            toast.error(err.message || 'Payment succeeded but application creation failed. Please contact support.');
          } finally {
            setUploading(false);
          }
        },
        (error) => {
          console.error("Payment failed:", error);
          if (error.message?.includes('cancelled')) {
             toast(error.message, { icon: 'ℹ️' });
          } else {
             toast.error(error.message || "Payment failed or was cancelled.");
          }
          setUploading(false);
        }
      );
      
    } catch (error: any) {
      console.error("Initiation error:", error);
      toast.error(error.message || 'Failed to initiate application process.');
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
              required
            />
            <Input 
              label="Phone Number" 
              name="applicantPhone"
              value={formData.applicantPhone}
              onChange={handleInputChange}
              required
            />
            <Input 
              label="Aadhaar Number" 
              name="applicantAadhaar"
              placeholder="1234 5678 9012"
              value={formData.applicantAadhaar}
              onChange={handleInputChange}
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Document Uploads */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Required Documents</h2>
          <div className="space-y-4">
            {service.requiredDocuments.map((docName, idx) => (
              <div key={idx} className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50">
                <div className="mb-2 sm:mb-0">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    {docName}
                    <span className="text-red-500 ml-1">*</span>
                  </h4>
                  <p className="text-xs text-gray-500">Supported: JPG, PNG, PDF (Max 2MB)</p>
                </div>
                
                <div>
                  {files[docName] ? (
                    <div className="flex items-center bg-white border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                      <span className="truncate max-w-[150px]">{files[docName].name}</span>
                      <button type="button" onClick={() => handleRemoveFile(docName)} className="ml-2 text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(docName, e)}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={uploading}>
            {uploading ? 'Processing Gateway...' : 'Submit & Proceed to Pay'}
          </Button>
        </div>
      </form>
    </div>
  );
}
