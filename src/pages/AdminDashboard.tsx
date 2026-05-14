import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileText, CheckCircle, Clock, Search, BarChart3, Plus, Trash2, Eye, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type TabType = 'analytics' | 'requests' | 'services' | 'users';

export default function AdminDashboard() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [applications, setApplications] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, revenue: 0 });

  const fetchApplications = async () => {
    try {
      const q = query(collection(db, 'applications'));
      const querySnapshot = await getDocs(q);
      const appsData: any[] = [];
      let revenue = 0;
      
      querySnapshot.forEach((document) => {
        const data = document.data();
        appsData.push({ id: document.id, ...data });
        if (data.status === 'Completed' || data.status === 'Approved') {
          revenue += data.fee || 0;
        }
      });
      
      appsData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setApplications(appsData);
      
      setStats({
        total: appsData.length,
        pending: appsData.filter(a => ['Submitted', 'Document Verification', 'Processing'].includes(a.status)).length,
        approved: appsData.filter(a => ['Approved', 'Completed'].includes(a.status)).length,
        revenue
      });
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    }
  };

  const fetchServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const srvData: any[] = [];
      querySnapshot.forEach((doc) => srvData.push({ id: doc.id, ...doc.data() }));
      setServices(srvData);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchApplications(), fetchServices()]).finally(() => setLoading(false));
  }, []);

  const [rejectingApp, setRejectingApp] = useState<{id: string, currentStatus: string} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingApp, setViewingApp] = useState<any | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadRange, setDownloadRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleDownloadExcel = () => {
    let filteredData = applications;
    const now = new Date();
    
    if (downloadRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filteredData = applications.filter(app => app.createdAt?.toMillis() >= todayStart.getTime());
    } else if (downloadRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredData = applications.filter(app => app.createdAt?.toMillis() >= monthStart.getTime());
    } else if (downloadRange === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filteredData = applications.filter(app => app.createdAt?.toMillis() >= yearStart.getTime());
    } else if (downloadRange === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        filteredData = applications.filter(app => {
          const t = app.createdAt?.toMillis() || 0;
          return t >= start.getTime() && t <= end.getTime();
        });
      }
    }

    if (filteredData.length === 0) {
      toast.error('No records found for the selected range.');
      return;
    }

    const excelData = filteredData.map(app => ({
      'Application ID': app.id,
      'Applicant Name': app.applicantDetails?.applicantName || '',
      'Phone Number': app.applicantDetails?.applicantPhone || '',
      'Aadhaar': app.applicantDetails?.applicantAadhaar || '',
      'Address': app.applicantDetails?.address || '',
      'Service Name': app.serviceName || '',
      'Status': app.status || '',
      'Fee': app.fee || 0,
      'Submitted At': app.createdAt ? format(app.createdAt.toDate(), 'dd MMM yyyy, hh:mm a') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    XLSX.writeFile(workbook, `Applications_${downloadRange}.xlsx`);
    setShowDownloadModal(false);
  };

  const handleStatusChange = async (appId: string, newStatus: string, reason?: string) => {
    if (newStatus === 'Rejected' && !reason) {
      setRejectingApp({ id: appId, currentStatus: applications.find(a => a.id === appId)?.status || 'Submitted' });
      return;
    }

    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };
      if (reason) {
        updateData.rejectionReason = reason;
      }

      await updateDoc(doc(db, 'applications', appId), updateData);
      toast.success(newStatus === 'Rejected' ? 'Application rejected' : `Status updated to ${newStatus}`);
      fetchApplications();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setRejectingApp(null);
      setRejectionReason('');
    }
  };

  const confirmRejection = () => {
    if (!rejectingApp) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a valid reason for rejection');
      return;
    }
    handleStatusChange(rejectingApp.id, 'Rejected', rejectionReason);
  };


  const filteredApps = applications.filter(app => 
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicantDetails?.applicantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart Data Preparation
  const statusCounts = applications.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444'];

  // Trend Data for Line Chart (mock grouped by day logic)
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, 'MMM dd');
  }).reverse();

  const trendData = last7Days.map(date => {
    return {
      name: date,
      requests: Math.floor(Math.random() * 10) + applications.length / 7, // Placeholder logic
      revenue: Math.floor(Math.random() * 500)
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500">Manage E-Sevai applications, services and analytics</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'requests' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Requests
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'services' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Manage Services
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Manage Admins
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Requests</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-slate-800">{stats.total}</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold">Overall</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending Action</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-slate-800">{stats.pending}</span>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold">Review</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Processed</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-slate-800">{stats.approved}</span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold">Done</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-primary-900">₹{stats.revenue}</span>
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded font-bold">All Time</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Request Trends (Last 7 Days)</h3>
              <div className="h-72">
                {applications.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="requests" stroke="#004D40" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">No data available yet</div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Status Distribution</h3>
              <div className="h-72">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center text-xs">
                    <span className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden flex-1">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">All Applications</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button onClick={() => setShowDownloadModal(true)} variant="outline" className="shrink-0">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search ID, Name, Service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {showDownloadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Export Application Data</h3>
                    <button onClick={() => setShowDownloadModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <select 
                        value={downloadRange} 
                        onChange={(e) => setDownloadRange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary-500"
                      >
                        <option value="today">Today</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>

                    {downloadRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                          <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary-500"/>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                          <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-primary-500"/>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setShowDownloadModal(false)}>Cancel</Button>
                    <Button onClick={handleDownloadExcel}>Download Excel</Button>
                  </div>
                </div>
              </div>
            )}
            {rejectingApp && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Application</h3>
                  <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this application (App ID: {rejectingApp.id.slice(0,8)}).</p>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      rows={4}
                      placeholder="e.g. Document is blurred, details do not match..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setRejectingApp(null);
                        setRejectionReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmRejection}>Reject Application</Button>
                  </div>
                </div>
              </div>
            )}

            {viewingApp && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-full flex flex-col animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                      <p className="text-sm text-gray-500 mt-1">ID: {viewingApp.id} | Service: {viewingApp.serviceName}</p>
                    </div>
                    <button 
                      onClick={() => setViewingApp(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Details */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Applicant Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div>
                              <span className="text-xs text-gray-500 block">Full Name</span>
                              <span className="text-sm font-medium text-gray-900">{viewingApp.applicantDetails?.applicantName || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Phone Number</span>
                              <span className="text-sm font-medium text-gray-900">{viewingApp.applicantDetails?.applicantPhone || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Aadhaar Number</span>
                              <span className="text-sm font-medium text-gray-900">{viewingApp.applicantDetails?.applicantAadhaar || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Address</span>
                              <span className="text-sm font-medium text-gray-900">{viewingApp.applicantDetails?.address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Custom Fields (if any) */}
                        {Object.keys(viewingApp.applicantDetails || {}).filter(k => !['applicantName', 'applicantPhone', 'applicantAadhaar', 'address'].includes(k)).length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Additional Details</h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                              {Object.keys(viewingApp.applicantDetails).filter(k => !['applicantName', 'applicantPhone', 'applicantAadhaar', 'address'].includes(k)).map(key => (
                                <div key={key}>
                                  <span className="text-xs text-gray-500 block">{key}</span>
                                  <span className="text-sm font-medium text-gray-900">{viewingApp.applicantDetails[key]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Application Status</h4>
                          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-3">
                            <div>
                              <span className="text-xs text-gray-500 block">Current Status</span>
                              <span className={`inline-flex px-2 py-1 mt-1 text-xs font-semibold rounded-full 
                                ${viewingApp.status === 'Approved' || viewingApp.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                  viewingApp.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                {viewingApp.status}
                              </span>
                            </div>
                            {viewingApp.rejectionReason && (
                              <div>
                                <span className="text-xs text-red-500 block">Rejection Reason</span>
                                <span className="text-sm text-red-700">{viewingApp.rejectionReason}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-gray-500 block">Submitted At</span>
                              <span className="text-sm font-medium text-gray-900">
                                {viewingApp.createdAt ? format(viewingApp.createdAt.toDate(), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Fee Paid</span>
                              <span className="text-sm font-medium text-green-700">₹{viewingApp.fee || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Documents */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Uploaded Documents</h4>
                        <div className="space-y-3">
                          {viewingApp.documents && Object.keys(viewingApp.documents).length > 0 ? (
                            Object.entries(viewingApp.documents).map(([docName, url]) => (
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
                                    className="flex items-center text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Preview / Download
                                  </a>
                                </div>
                                {/* Attempt to show preview if it's likely an image or allow fallback for mock URLs */}
                                <div className="bg-gray-50 rounded aspect-video w-full flex items-center justify-center overflow-hidden border border-gray-100">
                                  {(url as string).includes('mocked_url') ? (
                                     <div className="text-center p-4">
                                       <p className="text-xs text-gray-400 mb-1">Preview not available.</p>
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
                  
                  <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end shrink-0">
                    <Button onClick={() => setViewingApp(null)}>Close</Button>
                  </div>
                </div>
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">App ID</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading records...</td></tr>
                ) : filteredApps.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No applications found.</td></tr>
                ) : (
                  filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-900 font-mono">{app.id.slice(0, 8)}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {app.applicantDetails?.applicantName || 'N/A'}
                        <div className="text-xs text-gray-500 font-normal">{app.applicantDetails?.applicantPhone}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{app.serviceName}</td>
                      <td className="p-4 text-sm text-gray-500">{app.createdAt ? format(app.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                          ${app.status === 'Approved' || app.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <select 
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-md p-1 focus:ring-primary-500"
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Document Verification">Verify Docs</option>
                            <option value="Processing">Processing</option>
                            <option value="Approved">Approve</option>
                            <option value="Completed">Complete</option>
                            <option value="Rejected">Reject</option>
                          </select>
                          <button 
                            onClick={() => setViewingApp(app)}
                            className="p-1 text-gray-500 hover:text-primary-600 bg-gray-100 hover:bg-primary-50 rounded transition-colors"
                            title="View Details & Documents"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <ServicesManager services={services} refreshServices={fetchServices} />
      )}

      {activeTab === 'users' && (
        <AdminsManager />
      )}
    </div>
  );
}

// Sub-component for managing admins
function AdminsManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter((u: any) => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Manage Administrators</h2>
          <p className="text-sm text-gray-500">Promote users to admins or revoke admin access</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td></tr>
            ) : (
              filteredUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-gray-900">{u.name || 'N/A'}</td>
                  <td className="p-4 text-sm text-gray-500">{u.email || 'N/A'}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    {u.role === 'admin' ? (
                      <button 
                        onClick={() => handleRoleChange(u.id, 'user')}
                        className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors"
                        disabled={u.email === 'niranjanns1925@gmail.com'}
                        title={u.email === 'niranjanns1925@gmail.com' ? "Cannot demote super admin" : "Revoke Admin Access"}
                      >
                       Revoke Admin
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRoleChange(u.id, 'admin')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                      >
                       Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sub-component for managing services
function ServicesManager({ services, refreshServices }: { services: any[], refreshServices: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSvc, setNewSvc] = useState({ 
    title: '', description: '', category: '', price: 0, 
    requiredDocuments: [''], 
    customFields: [] as { name: string; type: 'text'|'number'|'date'; label: string; required: boolean }[] 
  });

  const handleEditClick = (svc: any) => {
    setEditingId(svc.id);
    setNewSvc({
      title: svc.title,
      description: svc.description,
      category: svc.category,
      price: svc.price,
      requiredDocuments: svc.requiredDocuments && svc.requiredDocuments.length > 0 ? svc.requiredDocuments : [''],
      customFields: svc.customFields || []
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteDoc(doc(db, 'services', id));
        toast.success("Service deleted");
        refreshServices();
      } catch (error) {
        toast.error("Failed to delete service");
      }
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'services', id), { active: !current });
      toast.success(current ? "Service deactivated" : "Service activated");
      refreshServices();
    } catch (error) {
      toast.error("Failed to update service status");
    }
  };

  const handleDocumentChange = (index: number, val: string) => {
    const docs = [...newSvc.requiredDocuments];
    docs[index] = val;
    setNewSvc({ ...newSvc, requiredDocuments: docs });
  };

  const addDocumentField = () => setNewSvc({ ...newSvc, requiredDocuments: [...newSvc.requiredDocuments, ''] });
  
  const removeDocumentField = (index: number) => {
    const docs = [...newSvc.requiredDocuments];
    docs.splice(index, 1);
    setNewSvc({ ...newSvc, requiredDocuments: docs });
  };

  const addCustomField = () => {
    setNewSvc({
      ...newSvc,
      customFields: [...newSvc.customFields, { name: '', label: '', type: 'text', required: true }]
    });
  };

  const updateCustomField = (index: number, key: string, value: any) => {
    const fields = [...newSvc.customFields];
    fields[index] = { ...fields[index], [key]: value };
    setNewSvc({ ...newSvc, customFields: fields });
  };

  const removeCustomField = (index: number) => {
    const fields = [...newSvc.customFields];
    fields.splice(index, 1);
    setNewSvc({ ...newSvc, customFields: fields });
  };

  const handleSave = async () => {
    try {
      if (!newSvc.title || !newSvc.price) return toast.error("Title and Price required");
      
      const cleanDocs = newSvc.requiredDocuments.filter(d => d.trim() !== '');
      const cleanFields = newSvc.customFields.map(cf => ({ ...cf, name: cf.label.toLowerCase().replace(/[^a-z0-9]/g, '_') })).filter(cf => cf.label.trim() !== '');
      
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), {
          ...newSvc,
          requiredDocuments: cleanDocs,
          customFields: cleanFields,
          updatedAt: new Date()
        });
        toast.success("Service updated successfully!");
      } else {
        await addDoc(collection(db, 'services'), {
          ...newSvc,
          requiredDocuments: cleanDocs,
          customFields: cleanFields,
          active: true,
          createdAt: new Date()
        });
        toast.success("Service created successfully!");
      }
      
      setIsAdding(false);
      setEditingId(null);
      setNewSvc({ title: '', description: '', category: '', price: 0, requiredDocuments: [''], customFields: [] });
      refreshServices();
    } catch (error) {
      toast.error(editingId ? "Failed to update service" : "Failed to create service");
    }
  };

  return (
    <div className="space-y-6">
      {isAdding ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{editingId ? 'Edit Service' : 'Create New Service'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Service Title" value={newSvc.title} onChange={e => setNewSvc({...newSvc, title: e.target.value})} />
            <Input label="Category (e.g., Revenue, Identity)" value={newSvc.category} onChange={e => setNewSvc({...newSvc, category: e.target.value})} />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                rows={3} 
                value={newSvc.description} 
                onChange={e => setNewSvc({...newSvc, description: e.target.value})} 
              />
            </div>
            <Input label="Processing Fee (₹)" type="number" value={newSvc.price} onChange={e => setNewSvc({...newSvc, price: Number(e.target.value)})} />
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Required Documents</label>
              {newSvc.requiredDocuments.map((doc, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input 
                    value={doc} 
                    placeholder="e.g. Aadhaar Card, Photo..." 
                    onChange={e => handleDocumentChange(i, e.target.value)} 
                  />
                  {newSvc.requiredDocuments.length > 1 && (
                    <Button variant="danger" type="button" onClick={() => removeDocumentField(i)}><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addDocumentField} className="mt-2 text-xs">
                <Plus className="w-4 h-4 mr-1" /> Add Document Requirement
              </Button>
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Dynamic UI Form Fields</label>
                <Button type="button" variant="outline" size="sm" onClick={addCustomField} className="text-xs">
                  <Plus className="w-4 h-4 mr-1" /> Add Field
                </Button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Define additional fields the applicant must fill (beyond standard Name, Phone, Aadhaar, Address).</p>
              
              {newSvc.customFields.map((field, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-3 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <Input label="Field Label" placeholder="e.g. Annual Income" value={field.label} onChange={e => updateCustomField(i, 'label', e.target.value)} />
                  </div>
                  <div className="sm:w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-primary-500" value={field.type} onChange={e => updateCustomField(i, 'type', e.target.value)}>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2 rounded text-primary-600 focus:ring-primary-500" checked={field.required} onChange={e => updateCustomField(i, 'required', e.target.checked)} />
                      Required
                    </label>
                  </div>
                  <div className="flex items-end pb-1">
                    <Button variant="danger" type="button" size="sm" onClick={() => removeCustomField(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-8">
            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); setNewSvc({ title: '', description: '', category: '', price: 0, requiredDocuments: [''], customFields: [] }); }}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update Service' : 'Save Service'}</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Manage Services Directory</h2>
            <Button onClick={() => setIsAdding(true)}><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Name</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No custom services. Showing defaults in user app.</td></tr>
                ) : (
                  services.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium text-gray-900">{s.title}</td>
                      <td className="p-4 text-sm text-gray-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{s.category}</span></td>
                      <td className="p-4 text-sm font-medium text-primary-900">₹{s.price}</td>
                      <td className="p-4 text-sm font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-right space-x-2">
                        <button onClick={() => handleToggleActive(s.id, s.active)} className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors">
                          {s.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleEditClick(s)} className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

