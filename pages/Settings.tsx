import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, Camera, CheckCircle, AlertCircle, Save, X, Palette, HelpCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { getCurrentUser, updateUserProfile } from '../services/dataService';
import { User } from '../types';

export const Settings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: ''
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const avatarStyles = [
    { name: 'Classic', collection: 'avataaars' },
    { name: 'Robot', collection: 'bottts' },
    { name: 'Pixel', collection: 'pixel-art' },
    { name: 'Adventurer', collection: 'adventurer' },
    { name: 'Notionist', collection: 'notionists' },
    { name: 'Lorelei', collection: 'lorelei' },
    { name: 'Persona', collection: 'personas' },
    { name: 'Miniavs', collection: 'miniavs' },
  ];

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`
      }));
    }
  }, [currentUser]);

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validasi dasar sebelum buka modal konfirmasi
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setStatus({ type: 'error', message: 'Konfirmasi password baru tidak cocok.' });
        return;
      }
      if (formData.currentPassword !== currentUser.password) {
        setStatus({ type: 'error', message: 'Password saat ini salah.' });
        return;
      }
    }

    // Jika valid, buka modal konfirmasi
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    if (!currentUser) return;

    const updates: Partial<User> = {
      name: formData.name,
      avatar: formData.avatar
    };

    if (formData.newPassword) {
      updates.password = formData.newPassword;
    }

    const updatedUser = updateUserProfile(currentUser.id, updates);
    if (updatedUser) {
      setCurrentUser(getCurrentUser());
      setStatus({ type: 'success', message: 'Profil berhasil diperbarui!' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setIsConfirmModalOpen(false);
      
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const selectAvatarTemplate = (collection: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/${collection}/svg?seed=${formData.name}`;
    setFormData({ ...formData, avatar: newAvatar });
    setIsAvatarModalOpen(false);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Pengaturan Akun</h2>
        <p className="text-slate-500 font-medium">Perbarui informasi profil dan keamanan akun Anda.</p>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-fade-in-up ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{status.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmitAttempt} className="space-y-6">
        <Card title="Informasi Profil">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img 
                src={formData.avatar} 
                alt="Avatar" 
                className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-xl object-cover transition-transform group-hover:scale-105"
              />
              <button 
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-2 -right-2 p-3 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-all transform active:scale-90"
              >
                <Camera size={18} />
              </button>
            </div>
            <button 
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-emerald-700"
            >
              <Palette size={14} />
              Pilih Template Foto Profil
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Nama Lengkap</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Alamat Email</label>
              <input 
                type="email"
                disabled
                className="w-full px-5 py-3 border border-slate-100 rounded-2xl bg-slate-100 text-slate-400 font-bold cursor-not-allowed"
                value={formData.email}
              />
            </div>
          </div>
        </Card>

        <Card title="Keamanan Password" subtitle="Kosongkan jika tidak ingin mengubah password">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Password Saat Ini</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password"
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold transition-all"
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Password Baru</label>
                <input 
                  type="password"
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold transition-all"
                  placeholder="Password Baru"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Konfirmasi Password Baru</label>
                <input 
                  type="password"
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold transition-all"
                  placeholder="Ulangi Password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-3 transition-all transform active:scale-95 uppercase tracking-widest text-sm"
          >
            <Save size={18} />
            Simpan Perubahan
          </button>
        </div>
      </form>

      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-white/20">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-emerald-50/50">
              <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">Pilih Template Karakter</h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-xl shadow-sm transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {avatarStyles.map((style) => (
                  <button
                    key={style.collection}
                    type="button"
                    onClick={() => selectAvatarTemplate(style.collection)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="p-1 rounded-2xl border-2 border-transparent group-hover:border-emerald-500 transition-all">
                      <img 
                        src={`https://api.dicebear.com/7.x/${style.collection}/svg?seed=${formData.name}`} 
                        alt={style.name}
                        className="w-20 h-20 bg-slate-50 rounded-xl object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{style.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex items-start gap-3 border border-blue-100">
                <AlertCircle className="text-blue-500 shrink-0" size={18} />
                <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase">
                  Semua avatar di atas dibuat secara unik berdasarkan nama Anda. Mengubah nama akan mengubah detail pada karakter template.
                </p>
              </div>

              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-full mt-6 py-4 border border-slate-200 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
              >
                Tutup Pilihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-white/20">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <HelpCircle className="text-amber-500" size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-3">Konfirmasi Perubahan</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                Apakah Anda yakin ingin menyimpan perubahan pada profil ini? Data yang lama akan diperbarui secara permanen.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={handleConfirmSave}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 transform active:scale-95"
                >
                  Ya, Simpan Sekarang
                </button>
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};