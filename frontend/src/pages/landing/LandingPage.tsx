import { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  FileText,
  Building2,
  Play,
  Users,
  Activity,
  Award,
  ChevronRight,
  Globe,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/utils/constants';

export const LandingPage: FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Landing Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Link to={ROUTES.HOME} className="text-2xl font-bold tracking-tight text-brand-600 flex items-center gap-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg">
                P
              </span>
              PortFlow
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
            <a href="#overview" className="hover:text-brand-600 transition-colors">
              Overview
            </a>
            <a href="#workflow" className="hover:text-brand-600 transition-colors">
              Onboarding Workflow
            </a>
            <a href="#features" className="hover:text-brand-600 transition-colors">
              Features
            </a>
            <a href="#security" className="hover:text-brand-600 transition-colors">
              Security
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="sm">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-linear-to-b from-brand-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 text-brand-600" />
              <span>Next-Gen Customs Broker Onboarding Portal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Accelerate Customs Onboarding & Importer KYC in <span className="text-brand-600">Minutes</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-normal">
              Empower your customs brokerage with automated DGFT IEC verification, Customs Power of Attorney collection, AD Code port registration, and seamless ICEGATE integration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-md">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to={ROUTES.LOGIN} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  Sign In to Portal
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-6 text-xs font-medium text-gray-500 pt-4">
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> No Credit Card Required
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> Instant Broker Setup
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> ICEGATE Compatible
              </span>
            </div>
          </div>

          {/* Hero UI Mockup Illustration */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xl ring-1 ring-black/5">
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-6 space-y-4">
              {/* Mock Top Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    AT
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Acme Trade Logistics Pvt Ltd</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Corporate Importer
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active & Verified
                  </span>
                </div>
              </div>

              {/* Progress Bar Mockup */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>Customs Onboarding Progress (6 of 7 Steps Completed)</span>
                  <span className="text-brand-600 font-bold">85%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              {/* Steps Mockup Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-800">✓ Step 1: IEC Verification</span>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Verified on DGFT Database</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-800">✓ Step 2: Customs PoA</span>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Executed on Stamp Paper</p>
                </div>
                <div className="p-3 rounded-lg bg-brand-50 border border-brand-200">
                  <span className="font-bold text-brand-800">▶ Step 3: AD Code Registration</span>
                  <p className="text-[11px] text-brand-600 mt-0.5">Registered at JNPT Port</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview Section */}
      <section id="overview" className="py-16 bg-gray-50/70 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-600">99.8%</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                KYC Accuracy Rate
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600">70%</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                Faster Clearance Time
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">100%</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                ICEGATE Compatible
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-purple-600">0</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                Manual Compliance Errors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customs Onboarding Workflow Section */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              Standard Customs Broker Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-2">
              7-Step Automated Customs Onboarding
            </h2>
            <p className="text-gray-500 text-base mt-3">
              Every customer profile is automatically provisioned with a standardized, compliant customs clearance workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'KYC & IEC Verification',
                desc: 'Instant verification of DGFT Import Export Code, PAN card, and GSTIN active status.',
                icon: ShieldCheck,
              },
              {
                step: '02',
                title: 'Customs PoA Authorization',
                desc: 'Collection and digital archival of executed Customs Power of Attorney on stamp paper.',
                icon: FileText,
              },
              {
                step: '03',
                title: 'AD Code Port Registration',
                desc: 'Authorised Dealer bank letter registration across primary sea & air customs ports.',
                icon: Building2,
              },
              {
                step: '04',
                title: 'KYC Document Vault',
                desc: 'Encrypted storage for Director ID proof, office address proof, and cancelled cheques.',
                icon: Lock,
              },
              {
                step: '05',
                title: 'ICEGATE EDI Integration',
                desc: 'Linking customer GSTIN/IEC with ICEGATE portal for filing Bills of Entry online.',
                icon: Globe,
              },
              {
                step: '06',
                title: 'Duty Deferment & Guarantee',
                desc: 'Configuration of Duty Deferment facilities, EPCG licenses, or Customs Bonds.',
                icon: Award,
              },
              {
                step: '07',
                title: 'Compliance Sign-Off',
                desc: 'Final risk assessment audit and marking customer account active for customs clearance.',
                icon: CheckCircle2,
              },
              {
                step: '⚡',
                title: 'Auto Dashboard Sync',
                desc: 'Real-time synchronization of step progress, timestamps, and broker stats.',
                icon: Activity,
              },
            ].map((item, index) => {
              const IconComp = item.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-brand-300 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                      Step {item.step}
                    </span>
                    <IconComp className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid Section */}
      <section id="features" className="py-20 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Built Specifically for Customs Brokers & SaaS Teams
            </h2>
            <p className="text-gray-500 text-base mt-3">
              Comprehensive tools designed to manage customer onboarding, compliance, and customs operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="p-3 rounded-xl bg-brand-50 text-brand-600 w-fit">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Broker Multi-Tenant Isolation</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Securely isolate your customer records under your broker account. Strict database data isolation ensures complete privacy.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 w-fit">
                <Play className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Resume Onboarding Flow</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Never lose your place. One-click "Resume Onboarding" actions automatically navigate brokers to the exact active task.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 w-fit">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Real-Time Audit Trail</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Track every step status update, timestamp, and audit note. Complete historical log for customs compliance audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Highlights */}
      <section id="security" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-linear-to-r from-gray-900 via-gray-800 to-brand-950 p-8 sm:p-12 text-white shadow-xl">
            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Enterprise Security Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Bank-Grade JWT Security & Encrypted Verification
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                PortFlow implements FastAPI JWT Bearer authentication, bcrypt password hashing, and encrypted local token storage to ensure your customs brokerage data remains safe and compliant.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-semibold text-gray-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>FastAPI Bearer JWT Tokens</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Bcrypt Password Encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>PostgreSQL Data Isolation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Auto 401 Session Interceptor</span>
                </div>
              </div>

              <div className="pt-4">
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="md" className="bg-brand-500 hover:bg-brand-400 text-white">
                    Create Broker Account <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-100 bg-gray-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center space-x-2 font-bold text-gray-900">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-white text-xs">
              P
            </span>
            PortFlow SaaS Portal
          </div>
          <p>© 2026 PortFlow. Customs Clearance & Broker Onboarding Platform. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link to={ROUTES.LOGIN} className="hover:text-brand-600">
              Sign In
            </Link>
            <Link to={ROUTES.REGISTER} className="hover:text-brand-600">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
