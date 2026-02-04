import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Calendar, Users, ChevronRight, Shield, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { getTransactions, formatCurrency, getEvents, getCurrentUser, getUsers } from '../services/dataService';
import { TransactionType, Role, Transaction, Event, User } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allEvents, setEvents] = useState<Event[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const user = getCurrentUser();
  
  const isAdmin = user?.role === Role.KETUA || user?.role === Role.BENDAHARA;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [txData, evData, usData] = await Promise.all([
          getTransactions(),
          getEvents(),
          getUsers()
        ]);
        setTransactions(txData);
        setEvents(evData);
        setAllUsers(usData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-emerald-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-black uppercase tracking-widest text-xs">Menyinkronkan Data...</p>
      </div>
    );
  }

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const relevantEvents = [...allEvents]
    .filter(e => e.status !== 'Completed')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Ongoing' ? -1 : 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 3);

  // Fix: Explicitly type the accumulator for chartDataMap to avoid "unknown" type error during sort
  const chartDataMap = transactions.reduce((acc, curr) => {
    const date = curr.date;
    if (!acc[date]) acc[date] = { date, income: 0, expense: 0 };
    if (curr.type === TransactionType.INCOME) acc[date].income += curr.amount;
    else acc[date].expense += curr.amount;
    return acc;
  }, {} as Record<string, { date: string; income: number; expense: number }>);
  
  // Fix: Explicitly cast Object.values result to the appropriate type to resolve "Property 'date' does not exist on type 'unknown'" error.
  const chartData = (Object.values(chartDataMap) as Array<{ date: string; income: number; expense: number }>)
    .sort((a, b) => a.date.localeCompare(b.date));

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start justify-between group hover:shadow-lg transition-all border-b-4 border-b-transparent hover:border-b-emerald-500">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${colorClass} text-white shadow-xl group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {isAdmin ? 'Admin Dashboard' : 'Member Dashboard'}
          </h2>
          <p className="text-slate-500 font-medium">
            Assalamu'alaikum, <span className="text-emerald-700 font-bold">{user?.name}</span>. Data real-time aktif.
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 font-black text-[10px] uppercase tracking-widest shadow-sm">
            <Shield size={14} />
            Privileged Access Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Saldo Kas" value={formatCurrency(balance)} icon={Wallet} colorClass="bg-gradient-to-br from-blue-500 to-blue-700" />
        <StatCard title="Total Masuk" value={formatCurrency(totalIncome)} icon={TrendingUp} colorClass="bg-gradient-to-br from-emerald-500 to-emerald-700" />
        <StatCard title="Total Keluar" value={formatCurrency(totalExpense)} icon={TrendingDown} colorClass="bg-gradient-to-br from-rose-500 to-rose-700" />
        <StatCard title={isAdmin ? "Total Personil" : "Event Aktif"} value={isAdmin ? allUsers.length + " Anggota" : relevantEvents.length + " Agenda"} icon={isAdmin ? Users : Calendar} colorClass="bg-gradient-to-br from-slate-700 to-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Visualisasi Arus Kas" className="lg:col-span-2">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickFormatter={d => d.split('-')[2]} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="income" name="Masuk" stroke="#10b981" fill="#10b98133" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" name="Keluar" stroke="#f43f5e" fill="#f43f5e33" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          {isAdmin && (
             <Card title="Member Terdaftar">
                <div className="space-y-3">
                  {allUsers.slice(0, 4).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                      <img src={u.avatar} className="w-8 h-8 rounded-lg bg-slate-100" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{u.name}</p>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase">{u.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </Card>
          )}

          <Card title="Agenda Divisi" action={
             <button onClick={() => navigate('/events')} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center">
               Semua <ChevronRight size={14} />
             </button>
          }>
            <div className="space-y-4">
              {relevantEvents.map(event => (
                <div key={event.id} className="group p-3 rounded-2xl border border-slate-50 hover:bg-emerald-50 transition-all">
                   <div className="flex justify-between items-center mb-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${event.status === 'Ongoing' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                        {event.status}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">{event.date}</span>
                   </div>
                   <p className="text-xs font-black text-slate-800 group-hover:text-emerald-900">{event.name}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
