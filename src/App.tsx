import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { PerusahaanDashboard } from './pages/PerusahaanDashboard';
import { AuditorDashboard } from './pages/AuditorDashboard';
import { AdminPerusahaanDashboard } from './pages/AdminPerusahaanDashboard';
import { PublicReportPage } from './pages/PublicReportPage';
import { ProfilePage } from './pages/ProfilePage';
import { StudiKasusPage } from './pages/StudiKasusPage';
import { MessageCircle } from 'lucide-react';

const RouterView: React.FC = () => {
  const { path } = useNavigation();

  let content: React.ReactNode = <LandingPage />;

  if (path === '/login') {
    content = <LoginPage />;
  } else if (path.startsWith('/register')) {
    content = <RegisterPage />;
  } else if (path === '/owner') {
    content = <OwnerDashboard />;
  } else if (path === '/perusahaan') {
    content = <PerusahaanDashboard />;
  } else if (path === '/admin-perusahaan') {
    content = <AdminPerusahaanDashboard />;
  } else if (path === '/auditor') {
    content = <AuditorDashboard />;
  } else if (path === '/profile') {
    content = <ProfilePage />;
  } else if (path.startsWith('/lapor')) {
    content = <PublicReportPage />;
  } else if (path === '/studi-kasus') {
    content = <StudiKasusPage />;
  } else {
    content = <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative">
      <div>
        <Navbar />
        <main>{content}</main>
      </div>

      {/* Floating WhatsApp Contact Button */}
      <aside aria-label="Bantuan WhatsApp" className="fixed bottom-5 right-5 z-40">
        <a
          href="https://wa.me/6287879625033?text=Halo%20Admin%20Integritas360%2C%20saya%20ingin%20berkonsultasi"
          target="_blank"
          rel="noopener noreferrer"
          title="Hubungi Kami via WhatsApp: 087879625033"
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl shadow-emerald-600/40 border border-emerald-400/40 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 text-white animate-pulse" />
          <span className="hidden sm:inline">Hubungi Kami</span>
        </a>
      </aside>
    </div>
  );
};

export default function App() {
  return (
    <NavigationProvider>
      <AuthProvider>
        <RouterView />
      </AuthProvider>
    </NavigationProvider>
  );
}
