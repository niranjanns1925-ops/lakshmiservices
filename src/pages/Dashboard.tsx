import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Download, Loader2, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, appUser } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (appUser) {
      setProfileData({ name: appUser.name || '', phone: appUser.phone || '' });
    }
  }, [appUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
        phone: profileData.phone
      });
      toast.success("Profile updated successfully!");
      setIsEditProfileOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'applications'),
          where('userId', '==', user.uid),
          // orderBy('createdAt', 'desc') // Needs index, so we'll sort client-side for simple setup
        );
        
        const querySnapshot = await getDocs(q);
        const appsData: any[] = [];
        querySnapshot.forEach((doc) => {
          appsData.push({ id: doc.id, ...doc.data() });
        });
        
        appsData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setApplications(appsData);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Submitted</span>;
      case 'Document Verification':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><FileText className="w-3 h-3 mr-1" /> Verification</span>;
      case 'Processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</span>;
      case 'Approved':
      case 'Completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</span>;
      case 'Rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {appUser?.name}</h1>
          <p className="text-gray-500">Track your E-Sevai applications and manage your profile.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditProfileOpen(true)} className="w-fit">
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Applications</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-800">{applications.length}</span>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold">Overall</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending Approval</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-800">
              {applications.filter(a => ['Submitted', 'Document Verification', 'Processing'].includes(a.status)).length}
            </span>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold">Processing</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-800">
              {applications.filter(a => ['Approved', 'Completed'].includes(a.status)).length}
            </span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold">Done</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Wallet Balance</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-primary-900">₹0.00</span>
            <button className="text-[10px] text-white bg-primary-900 px-3 py-1 rounded font-bold">Top Up</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Application History</h2>
          <Link to="/services">
            <Button size="sm">Apply New Service</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
                      <p>You haven't applied for any services yet.</p>
                      <Link to="/services" className="mt-4">
                        <Button variant="outline">Browse Services</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <React.Fragment key={app.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {app.serviceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.createdAt ? format(app.createdAt.toDate(), 'PPP') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Link to={`/application/${app.id}`} className="text-primary-600 hover:text-primary-900" title="View Details">
                            <Eye className="w-5 h-5" />
                          </Link>
                          {['Approved', 'Completed'].includes(app.status) && (
                            <button className="text-green-600 hover:text-green-900" title="Download Receipt">
                              <Download className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {app.status === 'Rejected' && app.rejectionReason && (
                      <tr className="bg-red-50">
                        <td colSpan={5} className="px-6 py-3 text-sm text-red-800">
                          <div className="flex items-start">
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold block mb-1">Reason for Rejection:</span>
                              {app.rejectionReason}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                placeholder="9876543210"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                required
              />
              <div className="pt-4 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={updatingProfile}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

