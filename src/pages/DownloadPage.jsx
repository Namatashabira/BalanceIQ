import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Monitor, Shield, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, ArrowLeft,
  Lock, WifiOff, Bug, ArrowRight, Star, Cpu, HardDrive
} from 'lucide-react';
import BIQLogo from '../components/BIQLogo';

const DOWNLOAD_URL = 'https://github.com/Namatashabira/BalanceIQ/releases/latest/download/BusinessIQ.Setup.1.0.0.exe';

const steps = [
  {
    os: 'Google Chrome',
    icon: <Monitor className="h-5 w-5 text-blue-500" />,
    badge: 'Chrome',
    badgeColor: 'bg-blue-100 text-blue-700',
    steps: [
      { label: 'Click the "Download for Windows" button.' },
      { label: 'Chrome shows a warning bar at the bottom:', note: '"BusinessIQ Setup 1.0.0.exe is not commonly downloaded…" — Click the small arrow (⌄) next to it, then click "Keep".' },
      { label: 'A second prompt may appear saying "This file may harm your computer".', note: 'Click "Keep anyway". The file saves to your Downloads folder.' },
      { label: 'Open the downloaded file and follow the installer steps.' },
    ],
  },
  {
    os: 'Microsoft Edge',
    icon: <Monitor className="h-5 w-5 text-indigo-500" />,
    badge: 'Edge',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    steps: [
      { label: 'Click the "Download for Windows" button.' },
      { label: 'Edge shows a notification bar:', note: '"BusinessIQ Setup 1.0.0.exe was blocked because it could harm your device." — Click the three-dot menu (…) next to it, then select "Keep".' },
      { label: 'A dialog may ask "Are you sure you want to keep this file?"', note: 'Click "Keep anyway".' },
      { label: 'Open the file from your Downloads folder and install.' },
    ],
  },
  {
    os: 'Windows SmartScreen',
    icon: <Shield className="h-5 w-5 text-violet-500" />,
    badge: 'Windows',
    badgeColor: 'bg-violet-100 text-violet-700',
    steps: [
      { label: 'After opening the installer, Windows shows a blue screen:', note: '"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting." This is normal for new apps — it is NOT a virus.' },
      { label: 'Click "More info" — a small link below the warning text.' },
      { label: 'A "Run anyway" button will appear. Click it to proceed.' },
    ],
  },
];

const trustItems = [
  { icon: <Lock className="h-6 w-6 text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100', title: 'Open Source', desc: 'Source code is publicly available and auditable on GitHub' },
  { icon: <Bug className="h-6 w-6 text-teal-600" />, bg: 'bg-teal-50', border: 'border-teal-100', title: 'No Malware', desc: 'No ads, trackers, spyware, or bundled software' },
  { icon: <WifiOff className="h-6 w-6 text-cyan-600" />, bg: 'bg-cyan-50', border: 'border-cyan-100', title: 'Works Offline', desc: 'All your data stays on your device — no cloud required' },
  { icon: <Star className="h-6 w-6 text-amber-600" />, bg: 'bg-amber-50', border: 'border-amber-100', title: 'Free Forever', desc: 'No subscription, no hidden fees, no expiry' },
];

const sysReqs = [
  { icon: <Cpu className="h-4 w-4 text-gray-500" />, label: 'Windows 10 / 11 (64-bit)' },
  { icon: <HardDrive className="h-4 w-4 text-gray-500" />, label: '200 MB free disk space' },
  { icon: <CheckCircle className="h-4 w-4 text-gray-500" />, label: 'No internet required after install' },
];

function StepCard({ item, open, onToggle }) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${open ? 'border-emerald-300 shadow-md' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition ${open ? 'bg-emerald-50' : 'bg-white hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${open ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>{item.icon}</div>
          <div>
            <span className="font-semibold text-gray-900 text-sm">{item.os}</span>
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
          </div>
        </div>
        <div className={`p-1 rounded-full transition ${open ? 'bg-emerald-100' : 'bg-gray-100'}`}>
          {open ? <ChevronUp className="h-4 w-4 text-emerald-600" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 bg-white border-t border-emerald-100">
          <ol className="space-y-4">
            {item.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed">{s.label}</p>
                  {s.note && (
                    <div className="mt-2 flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 leading-relaxed">{s.note}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function DownloadPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">

      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="w-full px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BIQLogo size={36} />
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              BusinessIQ
            </span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Main two-column layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">

        {/* LEFT — sticky download panel */}
        <div className="lg:w-2/5 xl:w-1/3 bg-gradient-to-b from-emerald-600 to-teal-700 text-white flex flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] p-8 xl:p-12">
          <div className="flex-1 flex flex-col justify-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-sm font-medium mb-8 w-fit">
              <CheckCircle className="h-4 w-4 text-green-300" /> Free · No Account Required
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold mb-4 leading-tight">
              Download<br />BusinessIQ
            </h1>
            <p className="text-emerald-100 text-base mb-8 leading-relaxed">
              The complete business management desktop app. Works fully offline — your data never leaves your device.
            </p>

            {/* Main download button */}
            <a
              href={DOWNLOAD_URL}
              className="group inline-flex items-center justify-center gap-3 bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200 mb-4"
            >
              <Monitor className="h-5 w-5" />
              Download for Windows
              <Download className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
            </a>

            <p className="text-emerald-200 text-xs text-center mb-8">Version 1.0.0 · Windows 10/11 · 64-bit · ~120 MB</p>

            {/* System requirements */}
            <div className="space-y-2.5 mb-8">
              {sysReqs.map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-blue-100">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    {r.icon}
                  </div>
                  {r.label}
                </div>
              ))}
            </div>

            {/* GitHub link */}
            <a
              href="https://github.com/Namatashabira/BalanceIQ/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-emerald-200 hover:text-white transition"
            >
              Also on GitHub Releases <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Trust badges at bottom */}
          <div className="grid grid-cols-2 gap-3 mt-8 pt-8 border-t border-white/20">
            {trustItems.map((t, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-xl p-3">
                <div className="mb-1.5">{React.cloneElement(t.icon, { className: 'h-5 w-5 text-white' })}</div>
                <div className="text-xs font-semibold text-white">{t.title}</div>
                <div className="text-xs text-emerald-200 leading-tight mt-0.5">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — installation guide */}
        <div className="flex-1 p-8 xl:p-12 overflow-y-auto">

          {/* Warning banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 mb-10">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 mb-1">Your browser or Windows may show a security warning</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                This is completely normal for new apps that haven't been widely distributed yet.
                BusinessIQ is safe, open source, and hosted on GitHub. Follow the steps below to install it safely.
              </p>
            </div>
          </div>

          {/* Step guides */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-1">How to install past the warning</h2>
            <p className="text-sm text-gray-500 mb-5">Select your browser or the Windows popup you see:</p>
            <div className="space-y-3">
              {steps.map((item, i) => (
                <StepCard
                  key={i}
                  item={item}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* Why the warning appears */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" /> Why does this warning appear?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Windows SmartScreen and browsers flag apps that are newly published and haven't been downloaded by many users yet.
              This is a reputation-based system — it has nothing to do with whether the app is actually safe.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              As more users download BusinessIQ, the warning will disappear automatically. The app is open source —
              you can inspect every line of code on GitHub.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-center text-white">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-90" />
            <h3 className="font-bold text-xl mb-2">Ready to get started?</h3>
            <p className="text-emerald-100 text-sm mb-6">Download once, use forever. No subscription, no internet required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={DOWNLOAD_URL}
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 transition shadow-lg"
              >
                <Download className="h-4 w-4" /> Download Now
              </a>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold text-sm transition border border-white/30"
              >
                Try Web Version <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
