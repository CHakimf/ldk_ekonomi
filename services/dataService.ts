import { createClient } from '@supabase/supabase-js';
import { Transaction, Event, User, Role, TransactionType, TransactionCategory } from '../types';

/**
 * Helper untuk mengambil environment variables secara aman.
 */
const getEnvVar = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
      return (process.env as any)[key];
    }
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    console.warn(`Error accessing environment variable ${key}:`, e);
  }
  return '';
};

const rawUrl = getEnvVar('VITE_SUPABASE_URL');
const rawKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Supabase library melempar error jika URL kosong. 
// Kita gunakan placeholder agar aplikasi tidak crash saat startup jika belum dikonfigurasi.
const supabaseUrl = rawUrl || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const isConfigured = !!rawUrl && !!rawKey;

const KEYS = {
  SESSION: 'ldk_active_session'
};

// --- USER SERVICES ---

export const getUsers = async (): Promise<User[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return (data || []) as User[];
};

export const addUser = async (user: Omit<User, 'id' | 'joinedDate'>) => {
  if (!isConfigured) throw new Error('Database tidak terkonfigurasi');
  const { data, error } = await supabase
    .from('users')
    .insert([{ ...user, joined_date: new Date().toISOString().split('T')[0] }])
    .select()
    .single();

  if (error) throw error;
  return data as User;
};

export const deleteUser = async (id: string) => {
  if (!isConfigured) return;
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};

// --- TRANSACTION SERVICES ---

export const getTransactions = async (): Promise<Transaction[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return (data || []) as Transaction[];
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  if (!isConfigured) throw new Error('Database tidak terkonfigurasi');
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
};

export const deleteTransaction = async (id: string) => {
  if (!isConfigured) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

// --- EVENT SERVICES ---

export const getEvents = async (): Promise<Event[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return (data || []) as Event[];
};

export const addEvent = async (event: Omit<Event, 'id'>) => {
  if (!isConfigured) throw new Error('Database tidak terkonfigurasi');
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();

  if (error) throw error;
  return data as Event;
};

export const updateEvent = async (event: Event) => {
  if (!isConfigured) throw new Error('Database tidak terkonfigurasi');
  const { data, error } = await supabase
    .from('events')
    .update(event)
    .eq('id', event.id)
    .select()
    .single();

  if (error) throw error;
  return data as Event;
};

export const deleteEvent = async (id: string) => {
  if (!isConfigured) return;
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
};

// --- AUTH & HELPERS ---

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const loginUser = async (email: string, password?: string): Promise<User | null> => {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !data) return null;

  const user = data as User;
  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
  return userWithoutPassword as User;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.SESSION);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const getEventBudgetStats = async (eventId: string) => {
  const [allTx, events] = await Promise.all([getTransactions(), getEvents()]);
  const transactions = allTx.filter(t => t.eventId === eventId);
  const event = events.find(e => e.id === eventId);
  
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  
  return { 
    budget: event?.budget || 0, 
    used: totalExpense, 
    income: totalIncome, 
    remaining: (event?.budget || 0) - totalExpense 
  };
};

export const updateUserProfile = async (id: string, updates: Partial<User>) => {
  if (!isConfigured) throw new Error('Database tidak terkonfigurasi');
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  const current = getCurrentUser();
  if (current && current.id === id) {
    const { password: _, ...cleanUser } = data;
    localStorage.setItem(KEYS.SESSION, JSON.stringify(cleanUser));
  }
  
  return data as User;
};
