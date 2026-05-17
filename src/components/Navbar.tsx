import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase/client';
import toast from 'react-hot-toast';
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { Logo } from './Logo';

export default function Navbar() {
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
      navigate('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-primary-900 border-b border-primary-700 text-white shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button 
              className="sm:hidden mr-3 text-primary-100 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex-shrink-0 flex items-center gap-3" onClick={closeMenu}>
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <Logo className="w-full h-full p-1" />
              </div>
              <div>
                <h1 className="text-xs font-bold leading-tight uppercase tracking-wider">Lakshmi E-Sevai</h1>
                <p className="text-[10px] text-teal-200 uppercase tracking-tighter italic">லட்சுமி இ-சேவை</p>
              </div>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
              <Link to="/services" className="px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-800 transition-colors">Services</Link>
              <Link to="/#contact" className="px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-800 transition-colors">Contact Us</Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden lg:flex bg-primary-800 rounded-lg p-1 mr-2">
              <button className="px-3 py-1 text-[10px] font-bold bg-white text-primary-900 rounded shadow-sm">English</button>
              <button className="px-3 py-1 text-[10px] font-bold text-teal-200">தமிழ்</button>
            </div>
            {user ? (
              <>
                <Link 
                  to={appUser?.role === 'admin' ? '/admin' : '/dashboard'} 
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-primary-800 border-l-2 border-accent-500 hover:bg-primary-700 transition"
                  onClick={closeMenu}
                >
                  <UserIcon className="w-4 h-4 text-accent-500" />
                  <span>{appUser?.role === 'admin' ? 'Admin Panel' : 'My Account'}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-primary-100 hover:text-white hover:bg-primary-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-primary-100 hover:text-white transition">Login</Link>
                <Link to="/register" className="px-3 py-2 text-sm font-medium bg-white text-primary-800 rounded-md hover:bg-primary-50 transition">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-primary-800 border-t border-primary-700 pb-3 pt-2 px-2 space-y-1">
          <Link to="/services" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-700">Services</Link>
          <Link to="/#contact" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-700">Contact Us</Link>
          <div className="border-t border-primary-700 my-2 pt-2">
            {user ? (
              <>
                <Link 
                  to={appUser?.role === 'admin' ? '/admin' : '/dashboard'} 
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-700 flex items-center space-x-2"
                >
                  <UserIcon className="w-5 h-5 text-accent-500" />
                  <span>{appUser?.role === 'admin' ? 'Admin Panel' : 'My Account'}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-700 flex items-center space-x-2 mt-1"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-700">Login</Link>
                <Link to="/register" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-700 mt-1">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
