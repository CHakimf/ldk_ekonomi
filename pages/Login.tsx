import React, { useState } from 'react';
import { loginUser } from '../services/dataService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUser(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Email atau password salah.');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-emerald-900 p-10 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-950/50 rotate-3 transition-transform hover:rotate-0 cursor-default">
             <span className="text-4xl font-black text-emerald-900">L</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">LDK Ekonomi UBB</h2>
          <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mt-2">Sistem Informasi Pemasaran</p>
        </div>
        
        <div className="p-10">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-bold text-slate-800">Selamat Datang</h3>
            <p className="text-xs text-slate-400 font-medium">Silakan masuk untuk mengelola data divisi</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs rounded-2xl border border-rose-100 font-bold text-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Email</label>
              <input 
                type="email"
                required
                autoComplete="email"
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 font-bold"
                placeholder="email@ldk-ubb.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Password</label>
              <input 
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30 uppercase tracking-widest text-sm transform active:scale-95"
            >
              Masuk Sistem
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Gunakan akun Admin yang terdaftar
            </p>
          </div>
        </div>
      </div>
      <p className="mt-8 text-emerald-800 text-[10px] font-black uppercase tracking-widest opacity-30">© 2024 LDK Ekonomi UBB - Divisi Pemasaran</p>
    </div>
  );
};
