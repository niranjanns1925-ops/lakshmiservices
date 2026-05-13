import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';

export default function Navbar() {
  const { user, appUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  return (
    <nav className="bg-primary-900 border-b border-primary-700 text-white shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Lakshmi E-Sevai Logo" className="w-full h-full object-contain p-1" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                }} />
                <div className="hidden w-6 h-6 border-4 border-primary-900 border-t-accent-500 rounded-full"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xs font-bold leading-tight uppercase tracking-wider">Lakshmi E-Sevai</h1>
                <p className="text-[10px] text-teal-200 uppercase tracking-tighter italic">லட்சுமி இ-சேவை</p>
              </div>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
              <Link to="/services" className="px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-800 transition-colors">Services</Link>
              <Link to="/#contact" className="px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-800 transition-colors">Contact Us</Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex bg-primary-800 rounded-lg p-1 mr-2">
              <button className="px-3 py-1 text-[10px] font-bold bg-white text-primary-900 rounded shadow-sm">English</button>
              <button className="px-3 py-1 text-[10px] font-bold text-teal-200">தமிழ்</button>
            </div>
            {user ? (
              <>
                <Link 
                  to={appUser?.role === 'admin' ? '/admin' : '/dashboard'} 
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-primary-800 border-l-2 border-accent-500 hover:bg-primary-700 transition"
                >
                  <UserIcon className="w-4 h-4 text-accent-500" />
                  <span>{appUser?.role === 'admin' ? 'Admin Panel' : 'My Account'}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-primary-100 hover:text-white hover:bg-primary-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-primary-100 hover:text-white transition">Login</Link>
                <Link to="/register" className="px-3 py-2 text-sm font-medium bg-white text-primary-800 rounded-md hover:bg-primary-50 transition">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
