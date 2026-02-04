
import React, { useState, useMemo, useEffect } from 'react';
import { Download, Printer, FileText, Calendar, Activity, FileSpreadsheet } from 'lucide-react';
import { Card } from '../components/Card';
import { getTransactions, formatCurrency, getCurrentUser } from '../services/dataService';
import { TransactionType, Transaction } from '../types';

export const Reports: React.FC = () => {
  // Fix: Initialize allTransactions as a state and fetch it in useEffect
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const currentUser = getCurrentUser();
  
  useEffect(() => {
    const loadData = async () => {
      const data = await getTransactions();
      setAllTransactions(data);
    };
    loadData();
  }, []);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
    { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' }
  ];

  // Membuat daftar 10 tahun ke belakang secara dinamis
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }, []);

  const filteredTransactions = useMemo(() => {
    const monthStr = selectedMonth.toString().padStart(2, '0');
    const periodStr = `${selectedYear}-${monthStr}`;
    return allTransactions.filter(tx => tx.date.startsWith(periodStr));
  }, [allTransactions, selectedMonth, selectedYear]);

  const totalIncome = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0)
  , [filteredTransactions]);

  const totalExpense = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0)
  , [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const selectedMonthLabel = months.find(m => m.val === selectedMonth)?.label;
    
    // Header Kolom
    const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Pemasukan (Debit)', 'Pengeluaran (Kredit)'];
    
    // Judul dan Ringkasan
    let csvContent = `LAPORAN KEUANGAN LDK EKONOMI UBB\n`;
    csvContent += `Periode:;${selectedMonthLabel} ${selectedYear}\n\n`;
    
    csvContent += `RINGKASAN LABA RUGI\n`;
    csvContent += `Total Pendapatan:;${totalIncome}\n`;
    csvContent += `Total Pengeluaran:;${totalExpense}\n`;
    csvContent += `Surplus/Defisit Bersih:;${totalIncome - totalExpense}\n\n`;
    
    csvContent += `RINCIAN TRANSAKSI\n`;
    csvContent += headers.join(';') + '\n';
    
    filteredTransactions.forEach(tx => {
      const row = [
        tx.date,
        tx.category,
        tx.description.replace(/;/g, ','), 
        tx.type === TransactionType.INCOME ? tx.amount : 0,
        tx.type === TransactionType.EXPENSE ? tx.amount : 0
      ];
      csvContent += row.join(';') + '\n';
    });

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_LDK_Ekonomi_${selectedMonthLabel}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedMonthLabel = months.find(m => m.val === selectedMonth)?.label;

  return (
    <div className="space-y-6 print:space-y-0 print:m-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-no-break {
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}} />

      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h2>
            <p className="text-slate-500">Ekspor laporan ke format dokumen resmi atau spreadsheet.</p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={handleExportExcel}
               className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2 hover:bg-emerald-100 transition-colors font-semibold"
             >
               <FileSpreadsheet size={18} />
               Export Excel
             </button>
             <button 
               onClick={handlePrint}
               className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-900 shadow-sm transition-colors font-semibold"
             >
               <Printer size={18} />
               Cetak / PDF
             </button>
          </div>
        </div>

        <Card title="Pilih Periode Laporan" className="bg-white">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
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
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Tahun</label>
              <select 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700 font-medium"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white p-8 md:p-12 shadow-sm rounded-xl print:shadow-none print:p-0 border border-slate-100 print:border-none print:text-black">
        
        <div className="text-center mb-8 border-b-4 border-double border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Lembaga Dakwah Kampus (LDK)</h1>
          <h1 className="text-3xl font-extrabold uppercase tracking-widest text-emerald-900 print:text-black">Ekonomi UBB</h1>
          <p className="text-sm font-semibold mt-1">Universitas Bangka Belitung</p>
          <p className="text-[10px] mt-1 italic text-slate-500 print:text-black">Kampus Terpadu UBB, Gedung FE, Balunijuk, Bangka</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase underline underline-offset-4">Laporan Pertanggungjawaban Keuangan</h2>
          <p className="text-sm font-bold mt-2 text-slate-700 print:text-black uppercase">
            Periode: {selectedMonthLabel} {selectedYear}
          </p>
        </div>

        <div className="mb-8 print-no-break">
          <h3 className="text-sm font-bold mb-3 uppercase flex items-center gap-2 text-slate-900">
            <Activity size={16} className="print:hidden text-emerald-600" />
            Laporan Laba Rugi (Profit & Loss)
          </h3>
          <table className="w-full text-sm border-collapse border border-black">
            <tbody>
              <tr className="border-b border-black">
                <td className="p-3 font-bold bg-slate-50 print:bg-slate-100 border-r border-black w-2/3">Total Pendapatan (Revenue)</td>
                <td className="p-3 text-right text-emerald-700 font-bold print:text-black">{formatCurrency(totalIncome)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-3 font-bold bg-slate-50 print:bg-slate-100 border-r border-black">Total Pengeluaran (Expense)</td>
                <td className="p-3 text-right text-rose-700 font-bold print:text-black">({formatCurrency(totalExpense)})</td>
              </tr>
              <tr className="bg-slate-100 print:bg-slate-200 font-black">
                <td className="p-3 border-r border-black uppercase tracking-wider text-slate-900">Surplus / Defisit Bersih (Laba/Rugi)</td>
                <td className={`p-3 text-right text-lg border-black ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-rose-800'} print:text-black underline decoration-double`}>
                  {formatCurrency(totalIncome - totalExpense)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-12">
          <h3 className="text-sm font-bold mb-3 uppercase flex items-center gap-2 text-slate-900">
            <FileText size={16} className="print:hidden text-slate-700" />
            Rincian Arus Kas (Buku Pembantu)
          </h3>
          <table className="w-full text-[11px] text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 border-b border-black">
                <th className="p-2 border-r border-black font-bold text-center w-12">TGL</th>
                <th className="p-2 border-r border-black font-bold uppercase">Kategori</th>
                <th className="p-2 border-r border-black font-bold uppercase">Keterangan / Deskripsi</th>
                <th className="p-2 border-r border-black font-bold uppercase text-right w-28">Debit (Masuk)</th>
                <th className="p-2 font-bold uppercase text-right w-28">Kredit (Keluar)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-300 print:border-black">
                    <td className="p-2 border-r border-black text-center font-medium">{tx.date.split('-')[2]}</td>
                    <td className="p-2 border-r border-black font-medium">{tx.category}</td>
                    <td className="p-2 border-r border-black font-semibold">{tx.description}</td>
                    <td className="p-2 border-r border-black text-right text-emerald-700 print:text-black font-bold">
                      {tx.type === TransactionType.INCOME ? formatCurrency(tx.amount).replace('Rp', '') : '-'}
                    </td>
                    <td className="p-2 text-right text-rose-700 print:text-black font-bold">
                      {tx.type === TransactionType.EXPENSE ? formatCurrency(tx.amount).replace('Rp', '') : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic font-bold uppercase">
                    --- Tidak Ada Data Transaksi Untuk Periode Ini ---
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 print:bg-transparent font-bold">
               <tr className="border-t-2 border-black">
                 <td colSpan={3} className="p-2 border-r border-black text-right uppercase tracking-widest">Jumlah Total Transaksi (IDR)</td>
                 <td className="p-2 border-r border-black text-right text-emerald-800 print:text-black">{formatCurrency(totalIncome).replace('Rp', '')}</td>
                 <td className="p-2 text-right text-rose-800 print:text-black">{formatCurrency(totalExpense).replace('Rp', '')}</td>
               </tr>
            </tfoot>
          </table>
        </div>

        <div className="print-no-break mt-16 flex justify-between items-start">
           <div className="text-left">
             <div className="mb-20">
                <p className="text-xs font-bold mb-1">Diverifikasi oleh:</p>
                <p className="text-xs text-slate-500 italic print:text-black">Sistem Informasi LDK Ekonomi UBB</p>
             </div>
             <p className="text-xs font-medium">Doc ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
             <p className="text-[9px] text-slate-400 print:text-black">Waktu Cetak: {new Date().toLocaleString('id-ID')}</p>
           </div>
           
           <div className="text-center min-w-[200px]">
             <p className="mb-2 text-xs font-semibold">Bangka Belitung, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
             <p className="text-xs font-bold uppercase mb-20 underline">Hormat Kami,</p>
             <div className="inline-block border-b-2 border-black min-w-[180px] mb-1">
                <p className="font-bold text-sm uppercase px-4">{currentUser?.name || 'Administrator'}</p>
             </div>
             <p className="text-xs font-bold uppercase text-slate-700 print:text-black">{currentUser?.role || 'Pengurus LDK Ekonomi'}</p>
           </div>
        </div>

        <div className="hidden print:block fixed bottom-0 left-0 w-full text-center border-t border-slate-200 pt-2 text-[8px] text-slate-400">
          Laporan ini dihasilkan secara otomatis oleh Sistem Manajemen LDK Ekonomi UBB. Segala perubahan fisik tanpa validasi sistem dianggap tidak sah.
        </div>
      </div>
    </div>
  );
};