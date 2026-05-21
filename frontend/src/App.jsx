import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Mail, ShieldAlert, Activity, Wifi, BatteryFull, SignalHigh, Phone, MessageSquare, ShieldCheck, AlertTriangle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Calls from './pages/Calls';
import Detection from './pages/Detection';
import ActivityLog from './pages/Activity';

function IOSStatusBar() {
  const [time, setTime] = React.useState(() => {
    const d = new Date();
    return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTime(`${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')}`);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ios-status-bar">
      <div className="time">{time}</div>
      <div className="dynamic-island"></div>
      <div className="status-icons">
        <SignalHigh size={15} strokeWidth={2.5} />
        <Wifi size={15} strokeWidth={2.5} />
        <BatteryFull size={18} strokeWidth={2.5} />
      </div>
    </div>
  );
}

function TopHeader() {
  return (
    <div className="top-header">
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <div style={{width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(180deg, var(--color-green), var(--color-maroon))'}} />
        <div>
          <div className="header-title">Punjab Sindh Bank</div>
          <div style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 2}}>Fraud Notifier</div>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="bottom-nav">
      <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <LayoutDashboard size={24} />
      </NavLink>
      <NavLink to="/calls" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <Phone size={24} />
      </NavLink>
      <NavLink to="/messages" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <Mail size={24} />
      </NavLink>
      <NavLink to="/detection" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <ShieldAlert size={24} />
      </NavLink>
      <NavLink to="/activity" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <Activity size={24} />
      </NavLink>
    </div>
  );
}

function LiveScannerToast() {
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    const dummyEvents = [
      { type: 'Call', sender: '+91 98xxx xxxxx', status: 'FRAUD' },
      { type: 'SMS', sender: 'BankMsg', status: 'SAFE' },
      { type: 'Email', sender: 'support@apple-id.com', status: 'SUSPICIOUS' },
      { type: 'SMS', sender: '+44 77xx xxxxx', status: 'FRAUD' },
      { type: 'Call', sender: 'Unknown Number', status: 'SUSPICIOUS' },
    ];

    const showRandomToast = () => {
      const event = dummyEvents[Math.floor(Math.random() * dummyEvents.length)];
      setToast({...event, id: Date.now()});
    };

    let timer;
    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 10000) + 10000; // 10 to 20s
      timer = setTimeout(() => {
        showRandomToast();
        scheduleNext();
      }, delay);
    };
    
    // First toast sooner to show feature
    timer = setTimeout(() => {
      showRandomToast();
      scheduleNext();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!toast) return null;

  const IconComponent = toast.status === 'SAFE' ? ShieldCheck : (toast.status === 'FRAUD' ? ShieldAlert : AlertTriangle);

  return (
    <div className="toast-container" key={toast.id}>
      <div className={`toast toast-${toast.status}`}>
        <div className="toast-icon">
          <IconComponent size={20} />
        </div>
        <div className="toast-content">
          <div className="toast-title">Background Scan: {toast.type}</div>
          <div className="toast-desc">{toast.sender} • {toast.status}</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container" role="application" aria-label="Punjab Sindh Bank Fraud Notifier">
        <IOSStatusBar />
        <TopHeader />
        <LiveScannerToast />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/detection" element={<Detection />} />
            <Route path="/activity" element={<ActivityLog />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
