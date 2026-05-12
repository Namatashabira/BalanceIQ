import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BIQLogo from '../components/BIQLogo';
import { 
  Building2, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Box,
  TrendingUp,
  Clock,
  Download,
  Monitor,
  Smartphone
} from 'lucide-react';

const DOWNLOAD_URL = 'https://github.com/Namatashabira/BalanceIQ/releases/latest/download/BusinessIQ.Setup.1.0.0.exe';

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/auth/business-types/`)
      .then(res => setBusinessTypes(res.data.business_types || []));
  }, []);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

const features = [
  {
    icon: Box,
    title: 'Products & Inventory',
    description:
      'Manage products, track stock levels, handle suppliers, batch tracking, and expiry dates in real time.'
  },
  {
    icon: Clock,
    title: 'Orders, Sales & Appointments',
    description:
      'Process orders, record sales, manage appointments, and track all transactions from one system.'
  },
  {
    icon: Globe,
    title: 'Connected E-commerce Website',
    description:
      'Get a fully connected online store linked to your inventory, orders, customers, and payments.'
  },
  {
    icon: BarChart3,
    title: 'Reports & Accounting',
    description:
      'View sales reports, financial summaries, receipts, and accounting records for complete control.'
  },
  {
    icon: TrendingUp,
    title: 'Analytics & AI Insights',
    description:
      'Understand business trends with AI-powered insights that help you make smarter decisions.'
  },
  {
    icon: TrendingUp,
    title: 'Sales & Stock Forecasting',
    description:
      'Predict future sales and stock demand using historical data to plan ahead and avoid shortages.'
  }
];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className={`${scrolled ? 'shadow-lg bg-white/90' : 'bg-white/50'} backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BIQLogo size={40} />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BusinessIQ
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 text-sm font-medium transition">Features</a>
              <Link to="/pricing" className="text-gray-700 hover:text-blue-600 text-sm font-medium transition">Pricing</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 text-sm font-medium transition">About</Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition"
              >
                Sign In
              </Link>
              <Link
                to="/download"
                className="hidden md:inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition shadow-md"
              >
                <Download className="h-4 w-4" />
                Download
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="flex flex-col items-center mb-8 animate-fade-in-down">
              <BIQLogo size={96} className="mb-4 drop-shadow-2xl" />
              <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <span>Welcome to BusinessIQ</span>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-tight animate-fade-in-down" style={{animationDelay: '100ms'}}>
              <span className="whitespace-nowrap">Intelligent Business</span>
              <span className="block whitespace-nowrap bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-12 animate-fade-in-down" style={{animationDelay: '200ms'}}>
              All-in-one solution for retail, restaurants, healthcare, education, and growing businesses. Manage sales, inventory, staff, customers, and reports with AI-powered insights.
            </p>
            
            <div className="flex justify-center mb-10 animate-fade-in-down" style={{animationDelay: '300ms'}}>
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold text-white overflow-hidden shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transform transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #7c3aed 100%)',
                }}
              >
                {/* animated shimmer overlay */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.15) 50%, transparent 80%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                {/* pulse ring */}
                <span className="absolute inset-0 rounded-2xl ring-2 ring-blue-400/40 group-hover:ring-blue-400/80 transition-all duration-300" />
                <Zap className="h-5 w-5 text-yellow-300 drop-shadow" />
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>

            {/* Download Section */}
            <div className="animate-fade-in-down" style={{animationDelay: '350ms'}}>
              <p className="text-sm text-gray-500 mb-3">Also available as a desktop app</p>
              <div className="flex flex-row gap-3 justify-center">
                <Link
                  to="/download"
                  className="group inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-xl font-semibold transition shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  <Monitor className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-xs text-gray-400 leading-none">Download for</div>
                    <div className="text-sm leading-tight">Windows</div>
                  </div>
                  <Download className="h-4 w-4 group-hover:translate-y-0.5 transition flex-shrink-0" />
                </Link>
                <a
                  href="/downloads/BusinessIQ.apk"
                  download
                  className="group inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-xl font-semibold transition shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  <Smartphone className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-xs text-gray-400 leading-none">Download for</div>
                    <div className="text-sm leading-tight">Android</div>
                  </div>
                  <Download className="h-4 w-4 group-hover:translate-y-0.5 transition flex-shrink-0" />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-gray-600 animate-fade-in-down" style={{animationDelay: '400ms'}}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Instant setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools that adapt to your business and scale with your growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-2xl hover:border-blue-300 transition-all hover:scale-105 hover:-translate-y-2 duration-300"
              >
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-125 transition-all shadow-lg">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Tailored for your industry
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pre-configured templates and features for 14+ business types
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
            {businessTypes.map((type, index) => (
              <div
                key={type.value}
                className={`bg-white rounded-xl p-4 text-center border-2 cursor-pointer transition-all hover:shadow-lg transform hover:scale-105 ${selectedType === type.value ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                onClick={() => {
                  setSelectedType(type.value);
                  setTimeout(() => {
                    navigate('/register', { state: { preselectedBusinessType: type.value } });
                  }, 300);
                }}
              >
                <div className="text-sm font-bold text-gray-900">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Transform Your Business with BusinessIQ
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of businesses already using BusinessIQ to streamline operations, boost efficiency, and drive growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="bg-white/20 backdrop-blur text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/30 transition border border-white/30"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BIQLogo size={32} />
                <span className="text-xl font-bold text-white">BusinessIQ</span>
              </div>
              <p className="text-sm leading-relaxed">
                All-in-one business management platform built in Fort Portal, Uganda — for every business, no exclusions.
              </p>
            </div>
            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-purple-400 transition">Features</a></li>
                <li><Link to="/pricing" className="hover:text-purple-400 transition">Pricing</Link></li>
                <li><Link to="/download" className="hover:text-purple-400 transition">Download</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-purple-400 transition">About Us</Link></li>
                <li><Link to="/login" className="hover:text-purple-400 transition">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-purple-400 transition">Get Started</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-sm text-gray-500 text-center">
            © 2025 BusinessIQ. Built with ❤️ in Fort Portal, Uganda.
          </div>
        </div>
      </footer>
    </div>
  );
}
