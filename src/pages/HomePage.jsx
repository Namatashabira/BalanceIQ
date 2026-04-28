import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Clock
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);

  React.useEffect(() => {
    axios.get('http://localhost:8000/api/core/auth/business-types/')
      .then(res => setBusinessTypes(res.data.business_types || []));
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
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              { /*<div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
               <Sparkles className="h-6 w-6 text-white" />
              </div>*/}
              <img src="./media/logo.jpg" alt="BusinessOS Logo" className="h-12 w-auto" style={{ borderRadius: "50%" }} />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Globe className="h-4 w-4" />
              <span>All-in-One Business Management Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              All-In-One Business
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
             Manage sales, inventory, staff, customers, and reports in one powerful system.
Built for retail, restaurants, healthcare, education, and growing businesses.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-xl hover:shadow-2xl inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
              </Link>
              <button className="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition shadow-md border border-gray-200">
                Watch Demo
              </button>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
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
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run your business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features that adapt to your industry and scale with your growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-xl hover:border-blue-200 transition group"
              >
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Built for your industry
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pre-configured templates and features for 14+ business types
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {businessTypes.map((type, index) => (
              <div
                key={type.value}
                className={`bg-white rounded-lg p-4 text-center border cursor-pointer transition ${selectedType === type.value ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'}`}
                onClick={() => {
                  setSelectedType(type.value);
                  setTimeout(() => {
                    navigate('/register', { state: { preselectedBusinessType: type.value } });
                  }, 300);
                }}
              >
                <div className="text-sm font-medium text-gray-700">{type.label}</div>
                <div className="text-xs text-gray-400 mt-1">{type.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Businesses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime SLA</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">14+</div>
              <div className="text-gray-600">Industries Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using <img src="./media/logo.jpg" alt="BusinessOS Logo" className="inline h-6 align-text-bottom"  style={{borderRadius: "50%"}}/>
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition shadow-xl"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {/*<div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>*/}
                <img src="./media/logo.jpg" alt="BusinessOS Logo" className="h-6 w-auto" style={{ borderRadius: "50px" }} />
              </div>
              <p className="text-sm">
                All-in-one business management platform for the modern enterprise.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 <img src="./media/logo.jpg" alt="BusinessOS Logo" className="inline h-5 align-text-bottom" style={{ borderRadius: "50%" }} />. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
