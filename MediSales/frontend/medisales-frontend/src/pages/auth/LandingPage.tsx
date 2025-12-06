import { Link } from 'react-router-dom';
import { Package, Shield, Users, ArrowRight, BarChart3, CheckCircle, Zap, DollarSign, Database, TrendingUp, Clock, Bell, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Scroll-based animation observer
      const elements = document.querySelectorAll('.scroll-reveal, .scroll-scale, .scroll-slide-left, .scroll-slide-right');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
        if (isInView) {
          el.classList.add('is-visible');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: DollarSign,
      title: 'Sales & POS',
      description: 'Lightning-fast checkout with barcode scanning, multiple payment methods, and instant receipt generation.',
      color: 'from-emerald-400 to-green-500'
    },
    {
      icon: Database,
      title: 'Smart Inventory',
      description: 'Real-time stock tracking with automated alerts for low inventory and expiring products.',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Powerful role-based access control with comprehensive staff activity tracking.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Instant notifications for critical events like low stock, expiries, and system updates.',
      color: 'from-orange-400 to-red-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics Hub',
      description: 'Comprehensive reports with data visualization and Excel export capabilities.',
      color: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Zap,
      title: 'Real-Time Sync',
      description: 'WebSocket-powered live updates and instant staff messaging across all devices.',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Animated Background Orbs - Enhanced */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-4 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-4 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Modern Glassmorphic Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg transition-all duration-300" style={{transform: `translateY(${Math.min(scrollY * 0.05, 5)}px)`}}>
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand / Logo on the left */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative flex h-14 w-14 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:rotate-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 relative z-10">
                  <rect x="10" y="16" width="28" height="16" rx="8" fill="#fff" opacity="0.3" />
                  <rect x="24" y="16" width="14" height="16" rx="7" fill="#4ade80" />
                  <rect x="10" y="16" width="14" height="16" rx="7" fill="#fff" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">MediSales</h1>
                <p className="text-xs font-bold text-blue-600/80 tracking-wider">Pharmacy Management</p>
              </div>
            </div>

            {/* Right actions: Admin/Staff login buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/admin-login"
                aria-label="Admin Login"
                title="Admin Login"
                className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 text-sm font-semibold shadow hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Admin Login
              </Link>

              <Link
                to="/staff-login"
                aria-label="Staff Login"
                title="Staff Login"
                className="inline-flex items-center rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1.5 text-sm font-semibold shadow hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* Add top padding so the fixed header doesn't overlap content */}
      <main className="relative z-10 pt-16">
        {/* Hero Section - Ultra Modern */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className={`text-center space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-600/20 backdrop-blur-sm shadow-lg animate-fade-in-up">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-600">Next-Gen Pharmacy Management</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight animate-fade-in-up animation-delay-200">
              <span className="block text-slate-900 mb-2">Transform Your</span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Pharmacy Operations</span>
            </h1>
            
            {/* Description */}
            <p className="mx-auto max-w-3xl text-lg sm:text-xl text-slate-600 leading-relaxed animate-fade-in-up animation-delay-400">
              Complete POS and inventory management system designed for modern pharmacies. 
              <span className="font-semibold text-slate-900"> Real-time tracking, automated alerts, and powerful analytics</span> in one unified platform.
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-8 pt-4 animate-fade-in-up animation-delay-600">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">Real-Time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">24/7 Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-bold text-slate-900">Cloud-Based</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid - Scroll Animated */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Powerful Features</h2>
            <p className="text-lg text-slate-600">Everything you need to manage your pharmacy efficiently</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="scroll-scale group relative backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden"
                style={{transitionDelay: `${index * 100}ms`}}
              >
                {/* Gradient Overlay on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <div className="relative p-6 space-y-4">
                  <div className={`inline-flex h-14 w-14 items-center justify-center bg-gradient-to-br ${feature.color} shadow-lg transition-all duration-500 group-hover:scale-125 group-hover:rotate-12`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
                
                {/* Bottom Accent */}
                <div className={`h-1.5 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`}></div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose MediSales - Completely Redesigned */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 backdrop-blur-sm shadow-lg mb-4">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-600">Why Choose Us</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Why Choose MediSales?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Built for modern pharmacies, designed for efficiency</p>
          </div>
          
          {/* Benefits Grid - Modern Card Layout */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Benefit 1 */}
            <div className="scroll-slide-left group relative backdrop-blur-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/20 hover:border-emerald-500/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">Lightning Fast POS</h3>
                <p className="text-slate-600 leading-relaxed">Process transactions in seconds with barcode scanning and instant inventory updates.</p>
              </div>
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
            
            {/* Benefit 2 */}
            <div className="scroll-scale group relative backdrop-blur-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 hover:border-blue-500/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden" style={{transitionDelay: '100ms'}}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 delay-200">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Smart Inventory</h3>
                <p className="text-slate-600 leading-relaxed">Automated stock tracking with predictive analytics and expiry monitoring.</p>
              </div>
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
            
            {/* Benefit 3 */}
            <div className="scroll-slide-right group relative backdrop-blur-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 hover:border-yellow-500/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden" style={{transitionDelay: '200ms'}}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 shadow-xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 delay-400">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-yellow-600 transition-colors">Proactive Alerts</h3>
                <p className="text-slate-600 leading-relaxed">Never miss critical events with real-time notifications for stock and expiry.</p>
              </div>
              <div className="h-1.5 bg-gradient-to-r from-yellow-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
            
            {/* Benefit 4 */}
            <div className="scroll-slide-left group relative backdrop-blur-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 hover:border-purple-500/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 shadow-xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 delay-600">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">Team Collaboration</h3>
                <p className="text-slate-600 leading-relaxed">Built-in messaging and role-based access for seamless team coordination.</p>
              </div>
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
            
            {/* Benefit 5 */}
            <div className="scroll-scale group relative backdrop-blur-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/20 hover:border-cyan-500/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden" style={{transitionDelay: '100ms'}}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 delay-800">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors">Advanced Analytics</h3>
                <p className="text-slate-600 leading-relaxed">Visualize sales trends, track performance, and export detailed reports.</p>
              </div>
              <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
            
            {/* Benefit 6 */}
            <div className="scroll-slide-right group relative backdrop-blur-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/20 hover:border-indigo-500/40 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden" style={{transitionDelay: '200ms'}}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 delay-1000">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">Real-Time Sync</h3>
                <p className="text-slate-600 leading-relaxed">WebSocket technology ensures instant data updates across all devices.</p>
              </div>
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
          </div>
        </section>

        {/* How It Works - Step by Step */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Get Started in Minutes</h2>
            <p className="text-lg text-slate-600">Simple setup, powerful results</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-purple-200"></div>
            
            <div className="scroll-scale relative group">
              <div className="backdrop-blur-xl bg-white/80 border border-slate-200 shadow-xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-black mb-6 mx-auto shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">Setup Products & Team</h3>
                <p className="text-slate-600 text-center leading-relaxed">Add your inventory with detailed information and create staff accounts with appropriate roles.</p>
              </div>
            </div>
            
            <div className="scroll-scale relative group" style={{transitionDelay: '100ms'}}>
              <div className="backdrop-blur-xl bg-white/80 border border-slate-200 shadow-xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-black mb-6 mx-auto shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">Start Selling</h3>
                <p className="text-slate-600 text-center leading-relaxed">Process transactions with barcode scanning while inventory updates automatically in real-time.</p>
              </div>
            </div>
            
            <div className="scroll-scale relative group" style={{transitionDelay: '200ms'}}>
              <div className="backdrop-blur-xl bg-white/80 border border-slate-200 shadow-xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-black mb-6 mx-auto shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">Monitor & Optimize</h3>
                <p className="text-slate-600 text-center leading-relaxed">Track performance with analytics, receive alerts, and export comprehensive reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics - Modern Cards */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="scroll-slide-left group backdrop-blur-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-white/20 shadow-xl p-8 transition-all duration-500 hover:scale-110 hover:shadow-2xl">
              <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-lg mb-4 mx-auto transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">7+</div>
                <div className="text-sm font-bold text-emerald-100">Core Modules</div>
              </div>
            </div>
            
            <div className="scroll-slide-right group backdrop-blur-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/20 shadow-xl p-8 transition-all duration-500 hover:scale-110 hover:shadow-2xl" style={{transitionDelay: '100ms'}}>
              <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-lg mb-4 mx-auto transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">100%</div>
                <div className="text-sm font-bold text-blue-100">Real-Time</div>
              </div>
            </div>
            
            <div className="scroll-slide-left group backdrop-blur-xl bg-gradient-to-br from-purple-500 to-pink-600 border border-white/20 shadow-xl p-8 transition-all duration-500 hover:scale-110 hover:shadow-2xl" style={{transitionDelay: '200ms'}}>
              <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-lg mb-4 mx-auto transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">Multi</div>
                <div className="text-sm font-bold text-purple-100">User Roles</div>
              </div>
            </div>
            
            <div className="scroll-slide-right group backdrop-blur-xl bg-gradient-to-br from-orange-500 to-red-600 border border-white/20 shadow-xl p-8 transition-all duration-500 hover:scale-110 hover:shadow-2xl" style={{transitionDelay: '300ms'}}>
              <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-lg mb-4 mx-auto transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-1">Excel</div>
                <div className="text-sm font-bold text-orange-100">Export Ready</div>
              </div>
            </div>
          </div>
        </section>

        {/* System Modules - Clean Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Complete System Modules</h2>
            <p className="text-lg text-slate-600">Every tool you need in one platform</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="scroll-slide-left group backdrop-blur-xl bg-white/70 border border-slate-200 shadow-lg p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Point of Sale</h3>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Quick product search with barcode scanning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Multiple payment methods (Cash, GCash, Card)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Instant receipt generation and printing</span>
                </li>
              </ul>
            </div>
            
            <div className="scroll-slide-right group backdrop-blur-xl bg-white/70 border border-slate-200 shadow-lg p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Smart Inventory</h3>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time stock level tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Automatic low stock alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Batch and expiry date monitoring</span>
                </li>
              </ul>
            </div>
            
            <div className="scroll-slide-left group backdrop-blur-xl bg-white/70 border border-slate-200 shadow-lg p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2" style={{transitionDelay: '100ms'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Analytics & Reports</h3>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Sales reports by date range</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Product performance analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Export to CSV and Excel formats</span>
                </li>
              </ul>
            </div>
            
            <div className="scroll-slide-right group backdrop-blur-xl bg-white/70 border border-slate-200 shadow-lg p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2" style={{transitionDelay: '100ms'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 shadow-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">User Management</h3>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Role-based access control</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Staff account management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Activity logging and audit trails</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Login Section - Ultra Modern */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative backdrop-blur-2xl bg-white/60 border border-white/40 shadow-2xl overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-indigo-100/50 to-purple-100/50"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-blob"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            </div>
            
            <div className="relative p-8 sm:p-12 lg:p-16">
              <div className="text-center mb-12 scroll-reveal">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Ready to Get Started?</h2>
                <p className="text-lg text-slate-600">Choose your access portal</p>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                {/* Admin Login Card */}
                <Link
                  to="/admin-login"
                  className="scroll-scale group relative backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl transition-all duration-500 hover:scale-110 hover:shadow-2xl overflow-hidden"
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative p-8 text-center space-y-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:shadow-2xl">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">Administrator</h3>
                    
                    <p className="text-slate-600 leading-relaxed">
                      Full system access with comprehensive control over inventory, sales, staff, and analytics.
                    </p>
                    
                    <div className="pt-4">
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                        Access Dashboard
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Accent */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                </Link>
                
                {/* Staff Login Card */}
                <Link
                  to="/staff-login"
                  className="scroll-scale group relative backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl transition-all duration-500 hover:scale-110 hover:shadow-2xl overflow-hidden"
                  style={{transitionDelay: '100ms'}}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative p-8 text-center space-y-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:shadow-2xl">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">Staff Member</h3>
                    
                    <p className="text-slate-600 leading-relaxed">
                      Process sales, view inventory, receive alerts, and communicate with your team efficiently.
                    </p>
                    
                    <div className="pt-4">
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                        Start Working
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Accent */}
                  <div className="h-1.5 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                </Link>
              </div>
              
              <div className="mt-8 text-center scroll-reveal">
                <p className="inline-flex items-center gap-2 text-slate-600 font-medium">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Enterprise-grade security with encrypted authentication
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Modern & Clean */}
      <footer className="relative backdrop-blur-xl bg-slate-900/95 border-t border-slate-800 mt-24">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3 mb-8">
            <div className="scroll-slide-left text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg transition-all duration-500 hover:scale-110 hover:rotate-6">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                    <rect x="10" y="16" width="28" height="16" rx="8" fill="#fff" opacity="0.3" />
                    <rect x="24" y="16" width="14" height="16" rx="7" fill="#4ade80" />
                    <rect x="10" y="16" width="14" height="16" rx="7" fill="#fff" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">MediSales</h3>
                  <p className="text-xs text-blue-400 font-bold">Pharmacy Management</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Complete POS and inventory management system designed for modern pharmacies.
              </p>
            </div>
            
            <div className="scroll-reveal text-center" style={{transitionDelay: '100ms'}}>
              <h4 className="text-lg font-bold text-white mb-4">Key Features</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-blue-400 transition-colors cursor-pointer">Sales & POS System</li>
                <li className="hover:text-blue-400 transition-colors cursor-pointer">Smart Inventory Control</li>
                <li className="hover:text-blue-400 transition-colors cursor-pointer">Team Management</li>
                <li className="hover:text-blue-400 transition-colors cursor-pointer">Real-Time Analytics</li>
              </ul>
            </div>
            
            <div className="scroll-slide-right text-center md:text-right" style={{transitionDelay: '200ms'}}>
              <h4 className="text-lg font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-blue-400 transition-colors cursor-pointer">Documentation</li>
                <li className="hover:text-blue-400 transition-colors cursor-pointer">Technical Support</li>
                <li className="hover:text-blue-400 transition-colors cursor-pointer">Contact Us</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center scroll-reveal">
            <p className="text-sm text-slate-500">
              © 2025 <span className="font-bold text-slate-400">MediSales</span>. All rights reserved. | Pharmaceutical Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

