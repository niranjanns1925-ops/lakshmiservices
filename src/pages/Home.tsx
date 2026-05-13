import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Clock, PhoneCall, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TiltCard } from '../components/ui/TiltCard';
import { Logo } from '../components/Logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 to-primary-800 text-white overflow-hidden py-24">
        <div className="absolute inset-0 bg-[url('https://maps.gstatic.com/tactile/omni/cell-pattern.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="w-24 h-24 mb-6 bg-white rounded-2xl p-2 backdrop-blur-sm shadow-xl flex items-center justify-center">
                <Logo className="w-full h-full" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Lakshmi E-Sevai Maiyam 💻✨
              </h1>
              <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl leading-relaxed">
                Your trusted partner for all government e-services. Fast 🚀, secure 🔒, and transparent 📊 digital gateway for citizens of Tamil Nadu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/services">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto shadow-lg shadow-accent-500/30">
                    View Services 📋 <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white/10 backdrop-blur-sm">
                    Create Account 👤
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 hidden md:block">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Digital Services" className="w-full h-auto rounded-2xl shadow-2xl ring-4 ring-white/10 transform rotate-3 hover:rotate-0 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Us?</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">We provide the most reliable and efficient way to access government services from the comfort of your home.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TiltCard>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Processing</h3>
                <p className="text-gray-600">Get your applications processed quickly with our streamlined digital workflow and real-time tracking.</p>
              </div>
            </TiltCard>
            
            <TiltCard>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-success-100 text-success-600 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Verified</h3>
                <p className="text-gray-600">Your documents and personal information are secured with industry-standard encryption protocols.</p>
              </div>
            </TiltCard>
            
            <TiltCard>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent Updates</h3>
                <p className="text-gray-600">Receive instant SMS and email notifications at every step of your application process.</p>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Popular Services Preview */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Popular Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { name: 'PAN Card', emoji: '💳' },
              { name: 'Patta Chitta', emoji: '📄' },
              { name: 'Community Certificate', emoji: '🏛️' },
              { name: 'Income Certificate', emoji: '💰' }
            ].map((service, i) => (
              <div key={i} className="h-full">
                <TiltCard>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex items-center justify-center gap-3">
                    <span className="text-2xl">{service.emoji}</span>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  </div>
                </TiltCard>
              </div>
            ))}
          </div>
          <Link to="/services">
            <Button variant="outline">Browse All Services</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

