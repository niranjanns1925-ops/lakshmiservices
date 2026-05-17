import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../context/AuthContext';
import { FileText, ArrowLeft, Loader2, Download, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';

export default function ApplicationDetails() {
  const { applicationId: id } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user || !id) return;
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data && data.userId === user.id) {
          setApplication(data);
        } else {
          setApplication(null); // unauthorized
        }
      } catch (error) {
        console.error("Error fetching application details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h1>
        <p className="text-gray-500 mb-8">The application you are looking for does not exist or you do not have permission to view it.</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Application Details</h1>
            <p className="text-sm text-gray-500 mt-1">ID: {application.id} | {application.serviceName}</p>
          </div>
          <div className="text-sm border border-gray-200 bg-white rounded-lg px-3 py-1.5 font-medium whitespace-nowrap self-start sm:self-auto">
            Status: <span className={
              application.status === 'Approved' || application.status === 'Completed' ? 'text-green-600' :
              application.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
            }>{application.status}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 line-height-relaxed">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Applicant Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {Object.entries(application.applicantDetails || {}).map(([key, value]) => (
                  <div key={key}>
                     <span className="text-xs text-gray-500 block capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                     <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))}
            </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Submission Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                 <div>
                   <span className="text-xs text-gray-500 block">Submitted At</span>
                   <span className="text-sm font-medium text-gray-900">
                     {(application.created_at || application.createdAt) ? format(new Date(application.created_at || application.createdAt), 'PPP p') : 'N/A'}
                   </span>
                 </div>
                 {application.fee && (
                   <div>
                     <span className="text-xs text-gray-500 block">Fee Paid</span>
                     <span className="text-sm font-medium text-green-700">₹{application.fee}</span>
                   </div>
                 )}
                 {application.rejectionReason && (
                   <div>
                     <span className="text-xs text-red-500 block">Rejection Reason</span>
                     <span className="text-sm text-red-700 font-medium">{application.rejectionReason}</span>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Uploaded Documents</h3>
            <div className="space-y-3">
              {application.documents && Object.keys(application.documents).length > 0 ? (
                Object.entries(application.documents).map(([docName, url]) => (
                  <div key={docName} className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors bg-white">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center text-sm font-medium text-gray-900">
                         <FileText className="w-4 h-4 mr-2 text-primary-500" />
                         {docName}
                       </div>
                       <a 
                         href={url as string} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex items-center text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded transition-colors"
                       >
                         <Download className="w-3 h-3 mr-1" />
                         Preview
                       </a>
                    </div>
                    <div className="bg-gray-50 rounded aspect-video w-full flex items-center justify-center overflow-hidden border border-gray-100">
                      {(url as string).includes('mocked_url') ? (
                         <div className="text-center p-4">
                           <p className="text-xs text-gray-400 mb-1">Preview not available (Mocked URL).</p>
                           <p className="text-[10px] text-gray-400 font-mono break-all">{url as string}</p>
                         </div>
                      ) : (
                        <iframe src={url as string} className="w-full h-full object-cover" title={docName} />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                   <p className="text-sm text-gray-500">No documents uploaded.</p>
                 </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
