import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BIQLogo from '../components/BIQLogo';
import {
  Target, Users, Zap, Globe, Shield, Heart,
  ArrowRight, Mail, Phone, MapPin, Calendar, Briefcase, Heart as HeartIcon
} from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'We exist to give every business — big or small — tools that are powerful, affordable, and easy to use.',
    color: '#7c3aed',
  },
  {
    icon: Users,
    title: 'Business First',
    description: 'Every feature starts with a real problem real business owners face. Your growth is our purpose.',
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
    description: 'Born in Fort Portal, built for Uganda, ready for the world. We understand your market.',
    color: '#db2777',
  },
  {
    icon: Heart,
    title: 'No Business Left Behind',
    description: 'We built this for all businesses — no exclusions. Whether you sell seeds, clothes, or electronics, this is for you.',
    color: '#ef4444',
  },
];

const milestones = [
  { year: '2025', event: 'Founded in Fort Portal City, Uganda by two software engineers' },
  { year: '2025', event: 'Identified the problem — businesses struggling with manual processes and lost orders' },
  { year: '2025', event: 'Built the first version covering orders, inventory, and analytics' },
  { year: '2025', event: 'Launched with real businesses across Fort Portal' },
  { year: '2026', event: 'Expanding to more businesses and regions across Uganda' },
];

export default function About() {
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-violet-50">

      {/* Nav */}
      <nav className={`${scrolled ? 'shadow-lg bg-white/90' : 'bg-white/50'} backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <BIQLogo size={38} />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                BusinessIQ
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/#features" className="text-gray-700 hover:text-purple-600 text-sm font-medium transition">Features</Link>
              <Link to="/pricing" className="text-gray-700 hover:text-purple-600 text-sm font-medium transition">Pricing</Link>
              <Link to="/about" className="text-purple-600 text-sm font-semibold border-b-2 border-purple-600 pb-0.5">About</Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition hidden sm:inline">
                Sign In
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-violet-700 transition shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-center px-4">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200 rounded-full filter blur-3xl opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <BIQLogo size={80} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Built for every business,
            <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              starting from Fort Portal
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            BusinessIQ was born out of a simple observation — businesses in Fort Portal and beyond were
            struggling with tools that were too expensive, too complex, or simply not built for them.
            Two engineers decided to change that.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-4">Our Story</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
                Started in Fort Portal, built for all businesses
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In 2025, two software engineers in Fort Portal City, Uganda looked around and saw the same
                problem everywhere — businesses struggling with manual records, lost orders, unbalanced
                books, and no real way to grow.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                They built BusinessIQ from the ground up to solve those exact problems. Not for one type
                of business — but for <span className="font-semibold text-purple-700">all businesses</span>.
                Whether you sell agricultural products, clothes, electronics, food, or anything else —
                this platform was built with you in mind.
              </p>
              <p className="text-gray-600 leading-relaxed">
                No business is excluded. That was the founding principle, and it still drives every
                decision we make today.
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-16 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
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

      {/* Highlights */}
      <section className="py-12 bg-purple-700">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { icon: <Calendar className="w-6 h-6 mx-auto mb-2 opacity-80" />, label: 'Founded', value: '2025' },
            { icon: <MapPin className="w-6 h-6 mx-auto mb-2 opacity-80" />, label: 'Origin', value: 'Fort Portal, UG' },
            { icon: <Users className="w-6 h-6 mx-auto mb-2 opacity-80" />, label: 'Built by', value: '2 Engineers' },
            { icon: <Briefcase className="w-6 h-6 mx-auto mb-2 opacity-80" />, label: 'For', value: 'All Businesses' },
          ].map(({ icon, label, value }) => (
            <div key={label}>
              {icon}
              <div className="text-2xl font-extrabold">{value}</div>
              <div className="text-purple-200 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-4">What We Stand For</span>
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

      {/* Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-4">Get In Touch</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">We'd love to hear from you</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Mail, label: 'Email Us', value: 'balanceiq567@gmail.com', color: '#7c3aed' },
              { icon: Phone, label: 'Call Us', value: '0794 448 439 / 0706 721 334', color: '#10b981' },
              { icon: MapPin, label: 'Visit Us', value: 'Fort Portal City, Uganda', color: '#db2777' },
            ].map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
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
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)' }}
          >
            <h3 className="text-2xl font-extrabold mb-3">Ready to transform your business?</h3>
            <p className="text-purple-100 mb-6 text-sm">Join businesses already growing with BusinessIQ.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-3 rounded-xl font-bold hover:bg-purple-50 transition shadow-lg hover:scale-105"
              >
                <Zap className="h-4 w-4 text-yellow-500" />
                Get Started
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
        <p className="flex items-center justify-center gap-1">© 2025 BusinessIQ. Built with <HeartIcon className="w-3 h-3 text-red-500 fill-red-500" /> in Fort Portal, Uganda.</p>
      </footer>
    </div>
  );
}
