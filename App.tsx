import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Events } from './pages/Events';
import { Reports } from './pages/Reports';
import { Members } from './pages/Members';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { getCurrentUser, logoutUser } from './services/dataService';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getCurrentUser());

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  // Sync state with storage for profile updates
  useEffect(() => {
    const checkUser = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          !user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
        } />
        
        <Route path="/" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        <Route path="/transactions" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Transactions />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        <Route path="/events" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Events />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        <Route path="/reports" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Reports />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        <Route path="/members" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Members />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        <Route path="/settings" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Settings />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;