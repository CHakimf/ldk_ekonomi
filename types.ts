export enum Role {
  KETUA = 'Ketua Pemasaran',
  BENDAHARA = 'Bendahara',
  ANGGOTA = 'Anggota Pemasaran'
}

export enum TransactionType {
  INCOME = 'Pemasukan',
  EXPENSE = 'Pengeluaran'
}

export enum TransactionCategory {
  DONATION = 'Donasi/Infaq',
  SALES = 'Penjualan Merchandise',
  SPONSORSHIP = 'Sponsorship',
  EVENT_FEE = 'Tiket Event',
  PROMOTION = 'Promosi & Iklan',
  PRINTING = 'Cetak & Dokumen',
  OPERATIONAL = 'Operasional',
  EVENT_COST = 'Biaya Event',
  OTHER = 'Lainnya'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Menambahkan password untuk login
  role: Role;
  avatar?: string;
  joinedDate: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  eventId?: string;
  proofUrl?: string;
  createdBy: string;
  createdById?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
  budget: number;
  status: 'Planned' | 'Ongoing' | 'Completed';
}
