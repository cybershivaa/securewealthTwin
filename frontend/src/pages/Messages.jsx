import React, { useEffect, useState } from 'react';
import { Brain, ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';

function Messages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [feedbackIds, setFeedbackIds] = useState(new Set());

  useEffect(() => {
    fetch('http://localhost:8000/scan-all', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        // Filter to messages only (non-call items)
        const msgsOnly = data.filter(it => it.type !== 'call');
        setItems(msgsOnly);
        setLoading(false);
        // persist activity logs
        const newLogs = msgsOnly.map((it) => ({
          id: it.id,
          timestamp: it.timestamp || new Date().toISOString(),
          action: `AI Scanned ${it.type}`,
          result: it.status
        }));
        const local = localStorage.getItem('pn_activity_logs');
        let existingLogs = [];
        if (local) { try { existingLogs = JSON.parse(local); } catch (e) {} }
        const existingIds = new Set(existingLogs.map(l => l.id));
        const toAdd = newLogs.filter(l => !existingIds.has(l.id));
        localStorage.setItem('pn_activity_logs', JSON.stringify([...toAdd, ...existingLogs]));
      })
      .catch((err) => {
        console.warn('Backend not reachable, using fallback', err);
        setItems([
          { id: 1, sender: 'bank@secure.com', type: 'email', text: 'Your monthly statement is ready.', timestamp: '2023-10-01', status: 'GENUINE', reasons: [], fraud_probability: 5, confidence: 88, explanation: 'Appears to be a genuine bank notification.' },
          { id: 2, sender: 'Unknown', type: 'sms', text: 'URGENT: Your account is locked. Click here: http://bit.ly/123', timestamp: '2023-10-02', status: 'FRAUD', reasons: ['Urgency manipulation', 'Shortened URL'], fraud_probability: 89, confidence: 92, explanation: 'This SMS shows phishing patterns with urgency and suspicious links.' },
        ]);
        setLoading(false);
      });
  }, []);

  const handleFeedback = async (item, isCorrect) => {
    if (feedbackIds.has(item.id)) return;
    try {
      await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_text: item.text,
          source_type: item.type,
          ai_classification: item.status,
          user_classification: isCorrect ? item.status : (item.status === 'FRAUD' ? 'GENUINE' : 'FRAUD'),
          is_correct: isCorrect,
          fraud_probability: item.fraud_probability || 0,
        })
      });
      setFeedbackIds(prev => new Set([...prev, item.id]));
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'GENUINE' || status === 'SAFE') return <ShieldCheck size={14} />;
    if (status === 'SUSPICIOUS') return <AlertTriangle size={14} />;
    return <ShieldAlert size={14} />;
  };

  const getBadgeClass = (status) => {
    if (status === 'GENUINE' || status === 'SAFE') return 'status-safe';
    if (status === 'SUSPICIOUS') return 'status-warn';
    return 'status-fraud';
  };

  const getStatusColor = (status) => {
    if (status === 'GENUINE' || status === 'SAFE') return 'var(--color-green)';
    if (status === 'SUSPICIOUS') return 'var(--color-yellow)';
    return 'var(--color-maroon)';
  };

  const filteredItems = items.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Safe') return item.status === 'GENUINE' || item.status === 'SAFE';
    if (filter === 'Fraud') return item.status === 'FRAUD';
    if (filter === 'Suspicious') return item.status === 'SUSPICIOUS';
    return true;
  });

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <Brain size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '0.5rem' }} />
      <div style={{ color: 'var(--text-muted)' }}>AI analyzing messages...</div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }' }} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={20} /> AI Inbox Scanner
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Safe', 'Suspicious', 'Fraud'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none',
                fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: filter === f ? 'var(--color-maroon)' : 'var(--border-color)',
                color: filter === f ? '#ffffff' : 'var(--text-main)'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredItems.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer' }}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="list-item-title">
                    {item.sender}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      ({item.type.toUpperCase()})
                    </span>
                  </div>
                  <div className="list-item-subtitle">{item.text}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {item.timestamp}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', marginLeft: '0.75rem' }}>
                  <div className={`status-badge ${getBadgeClass(item.status)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {getStatusIcon(item.status)} {item.status}
                  </div>
                  {item.fraud_probability != null && (
                    <div style={{
                      fontSize: '0.7rem', fontWeight: '700',
                      color: item.fraud_probability > 55 ? 'var(--color-maroon)' : item.fraud_probability > 30 ? '#ca8a04' : 'var(--color-green)',
                    }}>
                      {item.fraud_probability}% risk
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded AI Details */}
              {isExpanded && (
                <div style={{
                  marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px',
                  backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)',
                }} onClick={e => e.stopPropagation()}>

                  {/* Explanation */}
                  {item.explanation && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                        🧠 AI Reasoning
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                        {item.explanation}
                      </p>
                    </div>
                  )}

                  {/* Confidence + Risk */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    {item.confidence != null && (
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600',
                        backgroundColor: '#f3f4f6', color: '#374151',
                      }}>
                        Confidence: {item.confidence}%
                      </span>
                    )}
                    {item.risk_level && (
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600',
                        backgroundColor: `${getStatusColor(item.status)}15`,
                        color: getStatusColor(item.status),
                      }}>
                        Risk: {item.risk_level}
                      </span>
                    )}
                  </div>

                  {/* Reasons */}
                  {item.reasons && item.reasons.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                        Detection Flags
                      </div>
                      {item.reasons.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', padding: '0.2rem 0', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <span style={{ color: getStatusColor(item.status), fontWeight: '700' }}>•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestion */}
                  {item.suggestion && (
                    <div style={{
                      padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem',
                      backgroundColor: item.status === 'FRAUD' ? '#fef2f2' : item.status === 'SUSPICIOUS' ? '#fefce8' : '#f0fdf4',
                      marginBottom: '0.75rem', lineHeight: '1.4',
                    }}>
                      {item.suggestion}
                    </div>
                  )}

                  {/* Inline Feedback */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accurate?</span>
                    {feedbackIds.has(item.id) ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-green)', fontWeight: '600' }}>✓ Feedback recorded</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => handleFeedback(item, true)}
                          style={{
                            padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #bbf7d0',
                            backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                          }}>
                          <ThumbsUp size={11} /> Yes
                        </button>
                        <button onClick={() => handleFeedback(item, false)}
                          style={{
                            padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #fecaca',
                            backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                          }}>
                          <ThumbsDown size={11} /> No
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No communications found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
