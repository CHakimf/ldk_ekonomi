import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, X, Upload, Eye, FileText, Calendar, 
  TrendingUp, TrendingDown, Wallet, PieChart as PieChartIcon, Activity,
  Filter, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '../components/Card';
import { getTransactions, addTransaction, deleteTransaction, formatCurrency, getEvents } from '../services/dataService';
import { Transaction, TransactionType, TransactionCategory, Event } from '../types';

export const Transactions: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    { val: 0, label: 'Semua Bulan' },
    { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
    { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' }
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }, []);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.INCOME,
    category: TransactionCategory.OTHER,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    proofUrl: '',
    eventId: ''
  });
  const [fileName, setFileName] = useState('');

  const refreshData = async () => {
    setLoading(true);
    try {
      const [txData, evData] = await Promise.all([
        getTransactions(),
        getEvents()
      ]);
      setAllTransactions(txData);
      setEvents(evData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredData = useMemo(() => {
    return allTransactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesMonth = selectedMonth === 0 || (tDate.getMonth() + 1) === selectedMonth;
      const matchesYear = tDate.getFullYear() === selectedYear;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || t.type === filterType;
      
      return matchesMonth && matchesYear && matchesSearch && matchesType;
    });
  }, [allTransactions, selectedMonth, selectedYear, searchTerm, filterType]);

  const stats = useMemo(() => {
    const income = filteredData
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredData
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const map: Record<string, any> = {};
    [...filteredData].sort((a,b) => a.date.localeCompare(b.date)).forEach(t => {
      if (!map[t.date]) map[t.date] = { date: t.date, income: 0, expense: 0 };
      if (t.type === TransactionType.INCOME) map[t.date].income += t.amount;
      else map[t.date].expense += t.amount;
    });
    return Object.values(map);
  }, [filteredData]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    try {
      const newTx = await addTransaction({
        ...formData as any,
        createdBy: 'Anda', 
      });

      setAllTransactions(prev => [newTx, ...prev]);
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      alert("Gagal menyimpan transaksi");
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini secara permanen?')) {
      try {
        await deleteTransaction(id);
        setAllTransactions(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        alert("Gagal menghapus transaksi");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: TransactionType.INCOME,
      category: TransactionCategory.OTHER,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
      proofUrl: '',
      eventId: ''
    });
    setFileName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, proofUrl: url });
    }
  };

  const getEventName = (id?: string) => {
    if (!id) return null;
    return events.find(e => e.id === id)?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Keuangan</h2>
          <p className="text-slate-500">Pencatatan dan analisis arus kas divisi per periode.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          Catat Transaksi
        </button>
      </div>

      <Card className="bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 md:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Bulan</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white text-slate-700 font-medium"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Tahun</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700 font-medium"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari keterangan transaksi..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={24} /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Saldo Periode Ini</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(stats.balance)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={24} /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pemasukan</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.income)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown size={24} /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pengeluaran</p>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(stats.expense)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Tren Arus Kas" subtitle="Visualisasi harian dalam periode terpilih">
          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tickFormatter={d => d.split('-')[2]} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="income" name="Masuk" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Keluar" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Distribusi Pengeluaran" subtitle="Berdasarkan kategori transaksi">
          <div className="h-[280px] w-full flex flex-col items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400">
                <PieChartIcon size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs italic">Tidak ada data pengeluaran</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="Daftar Transaksi" action={
        <select 
          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 outline-none font-bold"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">Semua Tipe</option>
          <option value={TransactionType.INCOME}>Pemasukan</option>
          <option value={TransactionType.EXPENSE}>Pengeluaran</option>
        </select>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 pl-2 font-black uppercase text-[10px] tracking-widest">Tanggal</th>
                <th className="pb-3 font-black uppercase text-[10px] tracking-widest">Kategori & Event</th>
                <th className="pb-3 font-black uppercase text-[10px] tracking-widest">Keterangan</th>
                <th className="pb-3 font-black uppercase text-[10px] tracking-widest text-right">Jumlah</th>
                <th className="pb-3 pr-2 font-black uppercase text-[10px] tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3 pl-2 text-slate-600 whitespace-nowrap font-medium">{tx.date}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-block w-fit px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        tx.type === TransactionType.INCOME 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {tx.category}
                      </span>
                      {tx.eventId && (
                        <span className="flex items-center gap-1 text-[11px] text-blue-600 font-bold">
                          <Calendar size={10} />
                          {getEventName(tx.eventId)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-slate-800 max-w-xs truncate font-medium">{tx.description}</td>
                  <td className={`py-3 text-right font-black ${
                    tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-700'
                  }`}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 pr-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-xl transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTx(tx.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Filter size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold uppercase text-xs tracking-widest">Tidak ada data transaksi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-white/20">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-emerald-50/50">
              <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">Catat Transaksi</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-xl shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipe</label>
                  <select 
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                  >
                    {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal</label>
                  <input 
                    type="date"
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kategori</label>
                  <select 
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as TransactionCategory})}
                  >
                     {Object.values(TransactionCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Event (Opsional)</label>
                  <select 
                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold"
                    value={formData.eventId}
                    onChange={(e) => setFormData({...formData, eventId: e.target.value})}
                  >
                    <option value="">-- Bukan Event --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jumlah (Rp)</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Keterangan</label>
                <textarea 
                  rows={2}
                  className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold resize-none"
                  placeholder="Deskripsi transaksi..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bukti Transaksi</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                   <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*,.pdf" 
                    onChange={handleFileChange}
                   />
                   <Upload size={24} className={`mx-auto mb-2 ${fileName ? 'text-emerald-500' : 'text-slate-300'}`} />
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">
                     {fileName ? `File: ${fileName}` : 'Klik untuk upload bukti'}
                   </p>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-black shadow-lg shadow-emerald-600/20 transition-all uppercase tracking-widest text-xs transform active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-white/20">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">Detail Transaksi</h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-xl shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="flex justify-between items-start">
                 <div className="flex flex-col gap-2">
                   <span className={`w-fit px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      selectedTx.type === TransactionType.INCOME 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                   }`}>
                     {selectedTx.type}
                   </span>
                   {selectedTx.eventId && (
                     <span className="text-[11px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                       <Calendar size={12} />
                       {getEventName(selectedTx.eventId)}
                     </span>
                   )}
                 </div>
                 <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{selectedTx.date}</span>
               </div>

               <div>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Jumlah Transaksi</p>
                 <p className={`text-3xl font-black tracking-tighter ${
                   selectedTx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                 }`}>
                   {formatCurrency(selectedTx.amount)}
                 </p>
               </div>

               <div>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Keterangan</p>
                 <p className="text-slate-800 bg-slate-50 p-4 rounded-2xl text-sm font-bold leading-relaxed">{selectedTx.description}</p>
               </div>

               {selectedTx.proofUrl && (
                 <div>
                   <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Bukti Transaksi</p>
                   <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                     <img src={selectedTx.proofUrl} alt="Bukti" className="w-full h-auto max-h-56 object-cover" />
                   </div>
                 </div>
               )}

               <div className="pt-4">
                 <button 
                   onClick={() => setSelectedTx(null)}
                   className="w-full py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 font-black uppercase tracking-widest text-xs transition-all shadow-lg transform active:scale-95"
                 >
                   Tutup Detail
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
