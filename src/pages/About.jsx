import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BIQLogo from '../components/BIQLogo';
import {
  Target, Users, Zap, Globe, Shield, Heart,
  ArrowRight, CheckCircle, Mail, Phone, MapPin
} from 'lucide-react';

const team = [
  {
    name: 'Alex Mugisha',
    role: 'CEO & Co-Founder',
    bio: 'Visionary leader with 10+ years building software for African businesses.',
    initials: 'AM',
    color: '#2563eb',
  },
  {
    name: 'Sarah Nakato',
    role: 'CTO & Co-Founder',
    bio: 'Full-stack engineer passionate about scalable systems and AI-driven tools.',
    initials: 'SN',
    color: '#7c3aed',
  },
  {
    name: 'Brian Otieno',
    role: 'Head of Product',
    bio: 'Product strategist focused on delivering intuitive experiences for SMEs.',
    initials: 'BO',
    color: '#10b981',
  },
  {
    name: 'Grace Auma',
    role: 'Head of Customer Success',
    bio: 'Dedicated to helping every business unlock the full power of BusinessIQ.',
    initials: 'GA',
    color: '#db2777',
  },
];

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'We exist to empower African businesses with world-class tools that are affordable and easy to use.',
    color: '#2563eb',
  },
  {
    icon: Users,
    title: 'Customer First',
    description: 'Every feature we build starts with a real problem our customers face. Your success is our success.',
    color: '#7c3aed',
  },
  {
    icon: Zap,
    title: 'Built for Speed',
    description: 'Fast, reliable, and always available. We know downtime costs you money — so we obsess over uptime.',
    color: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Your business data is sacred. We use enterprise-grade encryption and security practices.',
    color: '#10b981',
  },
  {
    icon: Globe,
    title: 'Local & Global',
    description: 'Built in Uganda, designed for Africa, ready for the world. We understand your market.',
    color: '#db2777',
  },
  {
    icon: Heart,
    title: 'Community',
    description: 'We give back by supporting small businesses, startups, and entrepreneurs across East Africa.',
    color: '#ef4444',
  },
];

const milestones = [
  { year: '2022', event: 'BusinessIQ founded in Kampala, Uganda' },
  { year: '2023', event: 'Launched first version with 50 beta businesses' },
  { year: '2024', event: 'Reached 1,000+ active businesses across East Africa' },
  { year: '2025', event: 'Launched AI Insights, Forecasting & E-commerce modules' },
  { year: '2026', event: 'Expanding to West Africa & beyond' },
];

export default function About() {
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Nav */}
      <nav className={`${scrolled ? 'shadow-lg bg-white/90' : 'bg-white/50'} backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <BIQLogo size={38} />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BusinessIQ
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/#features" className="text-gray-700 hover:text-blue-600 text-sm font-medium transition">Features</Link>
              <Link to="/pricing" className="text-gray-700 hover:text-blue-600 text-sm font-medium transition">Pricing</Link>
              <Link to="/about" className="text-blue-600 text-sm font-semibold border-b-2 border-blue-600 pb-0.5">About</Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition hidden sm:inline">
                Sign In
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-center px-4">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200 rounded-full filter blur-3xl opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <BIQLogo size={80} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            We're building the future of
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              African Business Management
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            BusinessIQ was born out of a simple frustration — great business software was either too expensive,
            too complex, or not built for how African businesses actually operate. We changed that.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)' }}
          >
            Join Us Today <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">Our Story</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
                Started in Kampala, built for the world
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In 2022, our founders watched small business owners in Kampala struggle with paper records,
                WhatsApp orders, and spreadsheets that never balanced. They knew there had to be a better way.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                BusinessIQ was built from the ground up to handle the realities of African commerce —
                unreliable internet, mobile-first customers, multi-currency transactions, and the need
                for simplicity without sacrificing power.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, thousands of businesses across East Africa use BusinessIQ every day to manage
                inventory, process orders, track finances, and grow with confidence.
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-16 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                  >
                    {m.year}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-sm text-gray-700 font-medium">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">What We Stand For</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: v.color + '18' }}
                >
                  <v.icon className="h-6 w-6" style={{ color: v.color }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-4">The People</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Meet the Team</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">A passionate group of builders, designers, and problem-solvers committed to your success.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold mx-auto mb-4 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}99)` }}
                >
                  {member.initials}
                </div>
                <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                <p className="text-xs font-semibold text-blue-600 mb-2">{member.role}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-4">Get In Touch</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">We'd love to hear from you</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Mail, label: 'Email Us', value: 'hello@businessiq.app', color: '#2563eb' },
              { icon: Phone, label: 'Call Us', value: '+256 700 000 000', color: '#10b981' },
              { icon: MapPin, label: 'Visit Us', value: 'Kampala, Uganda', color: '#db2777' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: c.color + '15' }}
                >
                  <c.icon className="h-6 w-6" style={{ color: c.color }} />
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
                <p className="text-sm font-semibold text-gray-800">{c.value}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className="rounded-3xl p-10 text-center text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #7c3aed 100%)' }}
          >
            <h3 className="text-2xl font-extrabold mb-3">Ready to transform your business?</h3>
            <p className="text-blue-100 mb-6 text-sm">Start your 14-day free trial. No credit card required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg hover:scale-105"
              >
                <Zap className="h-4 w-4 text-yellow-500" />
                Start Free Trial
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white/20 border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/30 transition"
              >
                View Pricing <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BIQLogo size={24} />
          <span className="text-white font-semibold">BusinessIQ</span>
        </div>
        © 2026 BusinessIQ. All rights reserved.
      </footer>
    </div>
  );
}
