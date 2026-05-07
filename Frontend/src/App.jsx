import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Home from './pages/Home';
import MapNavigation from './pages/MapNavigation';
import Scan from './pages/Scan';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import Complaints from './pages/Complaints';
import ThemeProvider from './components/ThemeProvider';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster position="top-center" />
        <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<MapNavigation />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
