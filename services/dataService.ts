import { Transaction, Event, User, Role, TransactionType, TransactionCategory } from '../types';

const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Chakim Fadlan', 
    email: 'chakimfadlan@gmail.com', 
    password: '123456', 
    role: Role.KETUA, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fadlan', 
    joinedDate: '2024-05-20' 
  },
  { 
    id: 'u2', 
    name: 'Siti Aminah', 
    email: 'bendahara@ldk-ubb.com', 
    password: 'password123',
    role: Role.BENDAHARA, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti', 
    joinedDate: '2023-02-10' 
  },
  { 
    id: 'u3', 
    name: 'Admin Utama', 
    email: 'admin@ldk-ubb.com', 
    password: 'admin123',
    role: Role.KETUA, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 
    joinedDate: '2023-01-15' 
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_EVENTS: Event[] = [
  { id: 'e1', name: 'Seminar Ekonomi Syariah', date: '2023-10-20', description: 'Seminar besar tahunan', budget: 3000000, status: 'Completed' },
];

const KEYS = {
  TRANSACTIONS: 'ldk_transactions',
  EVENTS: 'ldk_events',
  USERS: 'ldk_users',
  SESSION: 'ldk_active_session'
};

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(KEYS.USERS);
  if (!stored) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
};

export const addUser = (user: Omit<User, 'id' | 'joinedDate'>) => {
  const current = getUsers();
  const newUser: User = { 
    ...user, 
    id: 'u' + Date.now(), 
    joinedDate: new Date().toISOString().split('T')[0] 
  };
  localStorage.setItem(KEYS.USERS, JSON.stringify([...current, newUser]));
  return newUser;
};

export const updateUserProfile = (userId: string, updates: Partial<User>) => {
  const users = getUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, ...updates };
    }
    return u;
  });
  localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
  
  // Update session if it's the current user
  const session = getCurrentUser();
  if (session && session.id === userId) {
    const updatedSession = { ...session, ...updates };
    // Remove password from session
    const { password: _, ...sessionSafe } = updatedSession as any;
    localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionSafe));
    return sessionSafe as User;
  }
  return null;
};

export const deleteUser = (id: string) => {
  const current = getUsers();
  localStorage.setItem(KEYS.USERS, JSON.stringify(current.filter(u => u.id !== id)));
};

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(KEYS.TRANSACTIONS);
  if (!stored) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  }
  return JSON.parse(stored);
};

export const getEvents = (): Event[] => {
  const stored = localStorage.getItem(KEYS.EVENTS);
  if (!stored) {
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    return INITIAL_EVENTS;
  }
  return JSON.parse(stored);
};

export const addEvent = (event: Omit<Event, 'id'>) => {
  const current = getEvents();
  const newEvent: Event = { ...event, id: 'e' + Date.now().toString() };
  localStorage.setItem(KEYS.EVENTS, JSON.stringify([...current, newEvent]));
  return newEvent;
};

export const updateEvent = (event: Event) => {
  const current = getEvents();
  const updated = current.map(e => e.id === event.id ? event : e);
  localStorage.setItem(KEYS.EVENTS, JSON.stringify(updated));
  return event;
};

export const deleteEvent = (id: string) => {
  const current = getEvents();
  localStorage.setItem(KEYS.EVENTS, JSON.stringify(current.filter(e => e.id !== id)));
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  if (!session) return null;
  const userSession = JSON.parse(session);
  // Re-sync with full user data for full permissions/password checks
  const allUsers = getUsers();
  return allUsers.find(u => u.id === userSession.id) || userSession;
};

export const loginUser = (email: string, password?: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
    return userWithoutPassword as User;
  }
  return null;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.SESSION);
};

export const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
  const current = getTransactions();
  const newTx: Transaction = { ...transaction, id: Date.now().toString() };
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([newTx, ...current]));
  return newTx;
};

export const deleteTransaction = (id: string) => {
  const current = getTransactions();
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(current.filter(t => t.id !== id)));
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const getEventBudgetStats = (eventId: string) => {
  const transactions = getTransactions().filter(t => t.eventId === eventId);
  const event = getEvents().find(e => e.id === eventId);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  return { budget: event?.budget || 0, used: totalExpense, income: totalIncome, remaining: (event?.budget || 0) - totalExpense };
};