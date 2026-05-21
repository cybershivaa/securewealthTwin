import React, { useEffect, useState } from 'react';
import { Brain, ShieldCheck, ShieldAlert, Activity, Zap } from 'lucide-react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    fetch('http://localhost:8000/get-dashboard-data')
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => {
        console.error(err);
        setData({
          balance: 12500.50, currency: "USD", recent_alerts: 2,
          total_messages_scanned: 145, safe_messages: 140, fraud_messages: 5,
          ai_engine_status: 'offline', ai_accuracy: 100, total_feedback: 0,
        });
        setLoading(false);
      });

    // Fetch AI status
    fetch('http://localhost:8000/ai/status')
      .then(r => r.json())
      .then(d => setAiStatus(d))
      .catch(() => setAiStatus(null));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const aiReady = data.ai_engine_status === 'ready';

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="hero-banner">
        <div className="hero-left">
          <div className="stat-title">Available Balance</div>
          <div className="stat-value" style={{fontSize: '2rem'}}>${data.balance.toLocaleString()}</div>
        </div>
        <div className="hero-right">
          <div style={{fontWeight: 700}}>{data.currency}</div>
          <div style={{marginTop: '0.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end'}}>
            <div style={{background: 'rgba(255,255,255,0.15)', padding: '0.45rem 0.6rem', borderRadius: 8}}>
              <div style={{fontSize: 12}}>Alerts</div>
              <div className="stat-value stat-val-yellow" style={{fontSize: '1.1rem'}}>{data.recent_alerts}</div>
            </div>
            <div style={{background: 'rgba(0,0,0,0.08)', padding: '0.45rem 0.6rem', borderRadius: 8}}>
              <div style={{fontSize: 12}}>Fraud</div>
              <div className="stat-value stat-val-maroon" style={{fontSize: '1.1rem'}}>{data.fraud_messages}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Engine Status Card */}
      <div className="card" style={{
        marginTop: '1rem',
        background: aiReady
          ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
          : 'linear-gradient(135deg, #92400e 0%, #b45309 100%)',
        color: 'white', borderRadius: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: '600' }}>AI FRAUD ENGINE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                {aiReady ? 'Online & Active' : 'Loading Models...'}
              </div>
            </div>
          </div>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: aiReady ? '#4ade80' : '#fbbf24',
            boxShadow: `0 0 8px ${aiReady ? '#4ade80' : '#fbbf24'}`,
            animation: aiReady ? 'none' : 'pulse-dot 1.5s infinite',
          }} />
        </div>

        {/* AI Capabilities */}
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {['Intent', 'Tone', 'Urgency', 'Manipulation', 'Phishing', 'Social Eng.'].map(cap => (
            <span key={cap} style={{
              padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '600',
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}>
              {cap}
            </span>
          ))}
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: '1rem' }}>
        <div className="card">
          <div className="stat-title">Messages Scanned</div>
          <div className="stat-value stat-val-green">{data.total_messages_scanned}</div>
        </div>
        <div className="card">
          <div className="stat-title">Safely Processed</div>
          <div className="stat-value">{data.safe_messages}</div>
        </div>
        <div className="card">
          <div className="stat-title">AI Accuracy</div>
          <div className="stat-value stat-val-green">{data.ai_accuracy}%</div>
        </div>
      </div>

      {/* Feedback Stats */}
      {data.total_feedback > 0 && (
        <div className="card" style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Activity size={16} />
            <strong style={{ fontSize: '0.9rem' }}>Continuous Learning</strong>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div><strong>{data.total_feedback}</strong> user feedback received</div>
            <div><strong>{data.ai_accuracy}%</strong> accuracy from feedback</div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '0.75rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={16} /> System Status
        </h3>
        <p style={{marginTop: '1rem', color: 'var(--text-muted)'}}>
          AI-powered semantic fraud detection is {aiReady ? 'fully operational' : 'initializing'}.
          The system uses transformer NLP models to analyze intent, tone, urgency, manipulation patterns,
          and social engineering tactics across all communication types.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}} />
    </div>
  );
}

export default Dashboard;
