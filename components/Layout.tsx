import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  CalendarDays, 
  FileText, 
  LogOut, 
  Menu, 
  Users,
  ShieldCheck,
  Settings as SettingsIcon
} from 'lucide-react';
import { User, Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user.role === Role.KETUA || user.role === Role.BENDAHARA;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Keuangan', path: '/transactions', icon: <Wallet size={20} /> },
    { label: 'Kegiatan & Event', path: '/events', icon: <CalendarDays size={20} /> },
    { label: 'Laporan', path: '/reports', icon: <FileText size={20} /> },
    { label: 'Pengaturan', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Manajemen Anggota', path: '/members', icon: <Users size={20} /> });
  }

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-emerald-900 text-white transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-emerald-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-800 font-black shadow-lg">
              LDK
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight tracking-tighter uppercase">Ekonomi UBB</h1>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">Pemasaran</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                  ${isActive 
                    ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]' 
                    : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'}
                `}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-emerald-800 bg-emerald-950/30">
            <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-white/5 border border-white/10">
               <img 
                 src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                 alt={user.name} 
                 className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-slate-800 object-cover"
               />
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-black truncate">{user.name}</p>
                 <p className="text-[10px] text-emerald-400 font-black uppercase tracking-tighter flex items-center gap-1">
                   {isAdmin && <ShieldCheck size={10} />}
                   {user.role}
                 </p>
               </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-900/20 text-rose-300 hover:text-white hover:bg-rose-600 transition-all text-xs font-black uppercase tracking-widest"
            >
              <LogOut size={16} />
              Keluar Sistem
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 shadow-sm md:hidden z-10 sticky top-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-600">
              <Menu size={24} />
            </button>
            <span className="font-black text-slate-800 tracking-tighter uppercase">LDK Ekonomi UBB</span>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
           <div className="max-w-7xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};