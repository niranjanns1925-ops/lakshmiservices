/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplicationDetails from './pages/ApplicationDetails';
import AdminDashboard from './pages/AdminDashboard';
import Services from './pages/Services';
import ApplyService from './pages/ApplyService';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Logo } from './components/Logo';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-slate-800">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<Services />} />
          <Route path="/apply/:serviceId" element={
            <ProtectedRoute>
              <ApplyService />
            </ProtectedRoute>
          } />
          <Route path="/application/:serviceId" element={
            <ProtectedRoute>
              <ApplicationDetails />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <footer className="bg-white border-t border-slate-200 px-8 py-3 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] sm:text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6">
              <Logo className="w-full h-full" />
            </div>
            <p>&copy; {new Date().getFullYear()} Lakshmi E-Sevai Maiyam. All Rights Reserved.</p>
          </div>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <a href="#" className="hover:text-primary-800">Privacy Policy</a>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <a href="#" className="hover:text-primary-800">Help Desk</a>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="text-[10px] font-bold text-slate-500">POWERED BY</span>
          <div className="text-primary-800 font-black text-xs tracking-tighter italic">TNeGA <span className="text-accent-500">PARTNER</span></div>
        </div>
      </footer>
    </div>
  );
}
