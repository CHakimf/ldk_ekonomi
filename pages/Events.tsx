
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, X, PieChart as PieChartIcon, Calendar, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../components/Card';
import { getEvents, formatCurrency, addEvent, updateEvent, deleteEvent, getTransactions } from '../services/dataService';
import { Event, Transaction, TransactionType } from '../types';

export const Events: React.FC = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    { val: 0, label: 'Semua Bulan' },
    { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
    { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' }
  ];

  // Tahun: 1 tahun ke depan + 10 tahun ke belakang
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => currentYear + 1 - i);
  }, []);

  const [formData, setFormData] = useState<Partial<Event>>({
    name: '',
    date: '',
    description: '',
    budget: 0,
    status: 'Planned'
  });

  useEffect(() => {
    refreshEvents();
  }, []);

  const refreshEvents = async () => {
    const [eventsData, txData] = await Promise.all([getEvents(), getTransactions()]);
    setAllEvents(eventsData);
    setAllTransactions(txData);
  };

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      const matchesYear = eventDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 0 || (eventDate.getMonth() + 1) === selectedMonth;
      return matchesYear && matchesMonth;
    });
  }, [allEvents, selectedMonth, selectedYear]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({ name: '', date: '', description: '', budget: 0, status: 'Planned' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({ ...event });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus event ini?')) {
      deleteEvent(id);
      refreshEvents();
    }
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.budget) return;
    
    if (editingEvent) {
      updateEvent({ ...editingEvent, ...formData } as Event);
    } else {
      addEvent(formData as any);
    }
    
    refreshEvents();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Kegiatan</h2>
          <p className="text-slate-500">Monitoring anggaran dan grafik realisasi setiap event pemasaran.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          Buat Event
        </button>
      </div>

      <Card className="bg-white">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Filter Bulan</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white text-slate-700"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Tahun</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex-none">
             <p className="text-sm text-slate-400 italic mb-2">
               Ditemukan {filteredEvents.length} event.
             </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {filteredEvents.map((event) => {
          // Fix: Calculate stats synchronously to avoid Promise-related errors
          const stats = (() => {
            const eventTxs = allTransactions.filter(t => t.eventId === event.id);
            const totalExpense = eventTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            const totalIncome = eventTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
            return {
              budget: event.budget || 0,
              used: totalExpense,
              income: totalIncome,
              remaining: (event.budget || 0) - totalExpense
            };
          })();
          
          const percentUsed = Math.min(100, Math.round((stats.used / (stats.budget || 1)) * 100));
          
          const chartData = [
            { name: 'Terpakai', value: stats.used, color: stats.used > stats.budget ? '#ef4444' : '#10b981' },
            { name: 'Sisa Anggaran', value: Math.max(0, stats.budget - stats.used), color: '#f1f5f9' }
          ];

          return (
            <Card key={event.id} className="relative overflow-visible group">
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                 event.status === 'Completed' ? 'bg-slate-300' : 
                 event.status === 'Ongoing' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
               }`} />
               
               <div className="flex flex-col lg:flex-row gap-6">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-slate-800">{event.name}</h3>
                       <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                         event.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                         event.status === 'Completed' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                         'bg-amber-50 text-amber-600 border-amber-200'
                       }`}>
                         {event.status}
                       </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                      <CalendarDays size={14} />
                      {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {event.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Budget</p>
                        <p className="text-sm font-bold text-slate-800">{formatCurrency(stats.budget)}</p>
                      </div>
                      <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                        <p className="text-[10px] text-rose-400 uppercase font-bold mb-1">Realisasi (Biaya)</p>
                        <p className="text-sm font-bold text-rose-600">{formatCurrency(stats.used)}</p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Pemasukan Event</p>
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(stats.income)}</p>
                      </div>
                      <div className={`p-3 rounded-lg border ${stats.remaining < 0 ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'}`}>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Sisa Budget</p>
                        <p className={`text-sm font-bold ${stats.remaining < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                          {formatCurrency(stats.remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 uppercase tracking-tight">Persentase Penggunaan Anggaran</span>
                        <span className={percentUsed > 90 ? 'text-rose-600' : 'text-emerald-600'}>{percentUsed}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            percentUsed > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>
                 </div>

                 <div className="w-full lg:w-48 h-48 lg:h-auto flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Visual Realisasi</p>
                    <div className="w-32 h-32 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={45}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(v: number) => formatCurrency(v)} 
                            contentStyle={{fontSize: '10px', borderRadius: '8px', border: 'none'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                         <PieChartIcon size={14} className="text-slate-300 mb-0.5" />
                         <span className="text-[10px] font-bold text-slate-400">{percentUsed}%</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex lg:flex-col justify-end gap-2 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    <button 
                      onClick={() => handleOpenEdit(event)}
                      className="flex-1 lg:flex-none p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                      title="Ubah Event"
                    >
                      <Edit2 size={18} className="mx-auto" />
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 lg:flex-none p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                      title="Hapus Event"
                    >
                      <Trash2 size={18} className="mx-auto" />
                    </button>
                 </div>
               </div>
            </Card>
          );
        })}
        {filteredEvents.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Search size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500">Tidak ada event pada periode ini.</p>
            <button onClick={handleOpenCreate} className="mt-4 text-emerald-600 font-medium hover:underline">
              Buat kegiatan baru
            </button>
          </div>
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-emerald-50">
              <h3 className="font-bold text-slate-800">
                {editingEvent ? 'Ubah Event' : 'Buat Event Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Nama Event</label>
                 <input 
                   required
                   className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                   placeholder="Contoh: Bazaar Ekonomi Kreatif" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                    <input 
                      required
                      className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                      className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="Planned">Planned</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Anggaran (Rp)</label>
                 <input 
                   required
                   className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                   type="number" 
                   placeholder="0"
                   value={formData.budget || ''}
                   onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat</label>
                 <textarea 
                   rows={2}
                   className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none" 
                   placeholder="Tujuan atau detail singkat event..."
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                 />
               </div>

               <div className="flex gap-3 pt-4">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                 >
                   Batal
                 </button>
                 <button 
                  type="submit" 
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-md shadow-emerald-600/20 transition-colors"
                 >
                   Simpan
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};