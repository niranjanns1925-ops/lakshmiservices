import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Clock, PhoneCall, ChevronRight, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';

const FADE_DOWN_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 10 } },
};

const FADE_UP_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 10 } },
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 3D Parallax effect states
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white selection:bg-accent-500 selection:text-white overflow-hidden">
      {/* 3D Hero Section */}
      <section 
        className="relative min-h-[90vh] flex items-center pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden border-b border-white/5"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        ref={containerRef}
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-[url('https://maps.gstatic.com/tactile/omni/cell-pattern.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[1000px] h-[500px] opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-600 via-primary-500 to-indigo-500 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[5s]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center">
          <motion.div 
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15 } }
            }}
            className="text-center max-w-5xl mx-auto w-full"
            style={{
              perspective: "1500px",
            }}
          >
            <motion.div 
               style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
               className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl blur-3xl -z-10" />
              
              <div 
                className="relative bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 md:p-16 shadow-[0_0_100px_rgba(30,58,138,0.2)]"
                style={{ transform: "translateZ(50px)" }}
              >
                <motion.div variants={FADE_DOWN_ANIMATION_VARIANTS} className="flex justify-center mb-8">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/90 text-sm font-medium backdrop-blur-md shadow-inner shadow-white/5">
                    <span className="flex h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse"></span>
                    Next-Gen official E-Sevai Gateway
                  </div>
                </motion.div>

                <motion.h1 
                  variants={FADE_DOWN_ANIMATION_VARIANTS}
                  className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]"
                  style={{ transform: "translateZ(80px)" }}
                >
                  <span className="text-white drop-shadow-2xl">Lakshmi </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 via-primary-300 to-accent-300 animate-gradient-x drop-shadow-lg">
                    E-Sevai
                  </span> Maiyam
                </motion.h1>

                <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="space-y-4 mb-12" style={{ transform: "translateZ(60px)" }}>
                  <p className="text-2xl md:text-4xl font-medium text-white/90 tracking-tight drop-shadow-md">
                    "எளிய தீர்வுகள், நம்பகமான சேவை – ஒரே இடத்தில்!"
                  </p>
                  <p className="text-xl md:text-2xl text-white/60 font-light">
                    Simple Solutions, Trusted Service at a Single Place.
                  </p>
                </motion.div>

                <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col sm:flex-row items-center justify-center gap-5" style={{ transform: "translateZ(40px)" }}>
                  <Link to="/services" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl text-lg font-semibold bg-white text-[#020617] hover:bg-gray-100 hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                      Explore Services <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                  </Link>
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl text-lg font-semibold border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-md">
                      Create Free Account
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features - Premium Dark Mode */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-[#0f172a] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:flex md:justify-between md:items-end">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold text-accent-400 tracking-widest uppercase mb-4">Enterprise Grade</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Designed for speed, <br/>built for trust.
              </h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Card */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary-900/40 to-primary-900/10 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden group backdrop-blur-xl"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                   <div className="w-16 h-16 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                     <Clock className="w-8 h-8 text-accent-400" />
                   </div>
                   <h3 className="text-3xl md:text-5xl font-bold mb-4 text-white">Blazing Fast Processing</h3>
                   <p className="text-white/60 text-lg md:text-xl max-w-md leading-relaxed">
                     Get your applications processed with unparalleled speed. Our streamlined digital workflow means no more waiting in lines.
                   </p>
                 </div>
                 <div className="flex items-center font-medium text-accent-400 group-hover:translate-x-2 transition-transform">
                    Learn more about our SLAs <ArrowRight className="ml-2 w-5 h-5" />
                 </div>
               </div>
            </motion.div>

            {/* Small Card 1 */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden hover:bg-white/10 transition-colors backdrop-blur-xl group"
            >
               <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                 <Shield className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">Secure & Encrypted</h3>
               <p className="text-white/60">Your documents are secured with bank-grade encryption and strict privacy protocols.</p>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden hover:bg-white/10 transition-colors backdrop-blur-xl group"
            >
               <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                 <FileText className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">Track Everything</h3>
               <p className="text-white/60">Real-time SMS and email notifications at every step of your application.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-32 relative border-t border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-900/20 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">Our Top Services</h2>
            <Link to="/services" className="inline-flex items-center text-xl font-medium text-accent-400 hover:text-accent-300 transition-colors">
              View comprehensive catalog <ArrowRight className="ml-2 w-6 h-6" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'PAN Card Services', desc: 'New, corrections & linking', icon: '💳' },
              { name: 'Revenue Dept', desc: 'Patta, Chitta, Adangal', icon: '📄' },
              { name: 'Certificates', desc: 'Community, Income, Nativity', icon: '🏛️' },
              { name: 'Passport', desc: 'New application & renewal', icon: '✈️' }
            ].map((service, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer aspect-square"
              >
                <div className="h-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden flex flex-col">
                   <div className="text-5xl mb-auto transform group-hover:scale-110 transition-transform origin-left drop-shadow-md">{service.icon}</div>
                   <div>
                     <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                     <p className="text-white/60 text-base">{service.desc}</p>
                   </div>
                   
                   <div className="absolute right-8 top-8 opacity-0 -translate-y-4 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 text-accent-400">
                      <ArrowRight className="w-6 h-6 -rotate-45" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/30 to-transparent -z-10" />
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-white drop-shadow-lg">Ready to simplify your documentation?</h2>
          <p className="text-2xl text-white/60 mb-12 max-w-3xl mx-auto font-light">Join thousands of citizens who have already experienced the fastest way to get government services online.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
             <Link to="/register">
               <Button size="lg" className="bg-accent-500 text-gray-900 hover:bg-accent-400 h-16 px-12 rounded-2xl text-xl font-bold shadow-[0_0_40px_rgba(52,211,153,0.3)] hover:scale-105 transition-all">
                 Get Started Now
               </Button>
             </Link>
             <p className="text-lg text-white/50 sm:ml-4 flex items-center font-medium">
               <CheckCircle2 className="w-6 h-6 mr-2 text-accent-500" />
               No hidden fees
             </p>
          </div>
        </div>
      </section>
      {/* Contact Section */}
      <section id="contact" className="py-24 relative border-t border-white/10 overflow-hidden bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-accent-400 tracking-widest uppercase mb-4">Get In Touch</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Contact Us</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center backdrop-blur-xl hover:bg-white/10 transition-colors"
            >
               <div className="w-16 h-16 bg-primary-500/10 text-primary-400 rounded-2xl flex items-center justify-center mb-6">
                 <Globe className="w-8 h-8" />
               </div>
               <h4 className="text-xl font-bold text-white mb-2">Visit Us</h4>
               <p className="text-white/60">Duraisamy Street, Ganapathi Nagar,<br/>Thiruvannaikovil</p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center backdrop-blur-xl hover:bg-white/10 transition-colors"
            >
               <div className="w-16 h-16 bg-accent-500/10 text-accent-400 rounded-2xl flex items-center justify-center mb-6">
                 <PhoneCall className="w-8 h-8" />
               </div>
               <h4 className="text-xl font-bold text-white mb-2">Call Us</h4>
               <p className="text-white/60">9943640299</p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center backdrop-blur-xl hover:bg-white/10 transition-colors"
            >
               <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
               </div>
               <h4 className="text-xl font-bold text-white mb-2">Email Us</h4>
               <p className="text-white/60">lakshmiesavicentre4@gmail.com</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}


