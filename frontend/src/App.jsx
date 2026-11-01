import React, { useState } from 'react';
import { useAuth } from './services/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LoanRisk from './pages/LoanRisk';
import InsuranceRisk from './pages/InsuranceRisk';
import PolicyReviewer from './pages/PolicyReviewer';
import InvestmentRisk from './pages/InvestmentRisk';
import FraudDetection from './pages/FraudDetection';
import Simulator from './pages/Simulator';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [simulatorInputs, setSimulatorInputs] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d1e] flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        <span className="text-xs font-semibold">Initializing FineGuard Security Context...</span>
      </div>
    );
  }

  // Unauthenticated routing
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Authenticated pages
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'loans':
        return (
          <LoanRisk
            onNavigate={setCurrentPage}
            onSendToSimulator={(inputs) => setSimulatorInputs(inputs)}
          />
        );
      case 'insurance':
        return <InsuranceRisk onNavigate={setCurrentPage} />;
      case 'policy-scanner':
        return <PolicyReviewer onNavigate={setCurrentPage} />;
      case 'investments':
        return <InvestmentRisk onNavigate={setCurrentPage} />;
      case 'fraud':
        return <FraudDetection onNavigate={setCurrentPage} />;
      case 'simulator':
        return <Simulator initialInputs={simulatorInputs} />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AppLayout>
  );
}
