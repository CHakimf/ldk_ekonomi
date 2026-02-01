import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, Calendar, X, Search, Lock } from 'lucide-react';
import { Card } from '../components/Card';
import { getUsers, addUser, deleteUser, getCurrentUser } from '../services/dataService';
import { User, Role } from '../types';

export const Members: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const activeUser = getCurrentUser();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.ANGGOTA
  });

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert("Semua field harus diisi!");
      return;
    }
    
    addUser({
      ...formData,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`
    });
    refreshUsers();
    setIsModalOpen(false);
    setFormData({ name: '', email: '', password: '', role: Role.ANGGOTA });
  };

  const handleDelete = (id: string) => {
    if (id === activeUser?.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    if (window.confirm('Hapus anggota ini dari sistem?')) {
      deleteUser(id);
      refreshUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Manajemen Anggota</h2>
          <p className="text-slate-500 font-medium">Admin dapat menambah, menghapus, dan mengatur role anggota.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 font-bold transition-all transform active:scale-95"
        >
          <UserPlus size={20} />
          Tambah Anggota
        </button>
      </div>

      <Card className="bg-white">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama atau email anggota..." 
            className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
             <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${
               user.role === Role.KETUA ? 'bg-amber-500' : user.role === Role.BENDAHARA ? 'bg-blue-500' : 'bg-emerald-500'
             }`}></div>
             
             <div className="flex items-center gap-4 mb-6 relative">
               <img src={user.avatar} className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-50 object-cover" alt={user.name} />
               <div>
                 <h4 className="font-black text-slate-800 tracking-tight">{user.name}</h4>
                 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    user.role === Role.KETUA ? 'bg-amber-100 text-amber-700' : 
                    user.role === Role.BENDAHARA ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                 }`}>
                   {user.role}
                 </span>
               </div>
             </div>

             <div className="space-y-3 mb-6">
               <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                 <Mail size={16} className="text-slate-300" />
                 <span className="truncate">{user.email}</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                 <Calendar size={16} className="text-slate-300" />
                 <span>Bergabung: {user.joinedDate}</span>
               </div>
             </div>

             <div className="flex gap-2">
               <button 
                 onClick={() => handleDelete(user.id)}
                 className="flex-1 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase"
               >
                 <Trash2 size={14} />
                 Hapus
               </button>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-white/20">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-emerald-50/50">
              <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">Tambah Anggota Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-xl shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                <input 
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold" 
                  placeholder="Contoh: Ahmad" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Akses</label>
                <input 
                  required
                  type="email"
                  className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold" 
                  placeholder="email@ldk-ubb.com" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Password Awal</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    required
                    type="text"
                    className="w-full border border-slate-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold" 
                    placeholder="Tentukan password..." 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jabatan / Akses</label>
                <select 
                  className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                >
                  <option value={Role.ANGGOTA}>Anggota Pemasaran</option>
                  <option value={Role.BENDAHARA}>Bendahara Divisi</option>
                  <option value={Role.KETUA}>Ketua Divisi (Admin)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95">
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
