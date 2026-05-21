import React, { useEffect, useState, useRef } from 'react';
import { Phone, ShieldAlert, PhoneIncoming, Brain, ShieldCheck, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';

function Calls() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [feedbackIds, setFeedbackIds] = useState(new Set());

  // Call Simulation States
  const [isCalling, setIsCalling] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveResult, setLiveResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    fetch('http://localhost:8000/scan-all', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        const callsOnly = data.filter(it => it.type === 'call');
        setItems(callsOnly);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Backend not reachable, using fallback', err);
        setItems([
          { id: 6, sender: 'Unknown', type: 'call', call_type: 'internet', text: 'This is the police. Your account is blocked.', timestamp: '2023-10-04', status: 'FRAUD', reasons: ['Social engineering'], fraud_probability: 91, confidence: 88, explanation: 'VoIP call impersonating law enforcement.' },
        ]);
        setLoading(false);
      });
  };

  const handleFeedback = async (item, isCorrect) => {
    if (feedbackIds.has(item.id)) return;
    try {
      await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_text: item.text,
          source_type: item.call_type === 'internet' ? 'internet_call' : 'voice_call',
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

  // --- Real-time Call Analysis ---
  const startAnalysis = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recog Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening && isCalling) recognition.start();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const analyzeCallWithAI = async () => {
    if (!transcript.trim()) return;
    setAnalyzing(true);
    try {
      const response = await fetch('http://localhost:8000/analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_number: '+91 98765-43210',
          call_type: 'voice',
          call_transcript: transcript,
        })
      });
      const data = await response.json();
      setLiveResult(data);
    } catch (err) {
      console.error('AI analysis failed:', err);
      setLiveResult({ status: 'GENUINE', fraud_probability: 0, explanation: 'AI engine not reachable.', reasons: [] });
    }
    setAnalyzing(false);
  };

  const stopCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsCalling(false);

    // Save to backend
    fetch('http://localhost:8000/analyze-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caller_number: '+91 98765-43210',
        call_type: 'voice',
        call_transcript: transcript || 'No voice detected'
      })
    }).then(r => r.json()).then(data => {
      const newLog = {
        id: Date.now(),
        sender: 'Incoming: +91 98765-43210',
        type: 'call',
        call_type: 'voice',
        text: transcript || 'No voice detected',
        timestamp: new Date().toLocaleString(),
        status: data.status,
        reasons: data.reasons,
        fraud_probability: data.fraud_probability,
        confidence: data.confidence,
        explanation: data.explanation,
        risk_level: data.risk_level,
        suggestion: data.suggestion,
      };
      setItems(prev => [newLog, ...prev]);
    }).catch(err => {
      console.error("Failed to sync call", err);
      const newLog = {
        id: Date.now(),
        sender: 'Incoming: +91 98765-43210',
        type: 'call',
        text: transcript || 'No voice detected',
        timestamp: new Date().toLocaleString(),
        status: liveResult?.status || 'GENUINE',
        reasons: liveResult?.reasons || [],
        fraud_probability: liveResult?.fraud_probability || 0,
      };
      setItems(prev => [newLog, ...prev]);
    });

    // Update local activity logs
    const activity = JSON.parse(localStorage.getItem('pn_activity_logs') || '[]');
    localStorage.setItem('pn_activity_logs', JSON.stringify([
      { id: Date.now(), action: 'AI Call Analyzed', result: liveResult?.status || 'GENUINE', timestamp: new Date().toISOString() },
      ...activity
    ]));

    setLiveResult(null);
    setTranscript('');
  };

  const getStatusColor = (status) => {
    if (status === 'GENUINE' || status === 'SAFE') return 'var(--color-green)';
    if (status === 'SUSPICIOUS') return 'var(--color-yellow)';
    return 'var(--color-maroon)';
  };

  const getBadgeClass = (status) => {
    if (status === 'GENUINE' || status === 'SAFE') return 'status-safe';
    if (status === 'SUSPICIOUS') return 'status-warn';
    return 'status-fraud';
  };

  const getStatusIcon = (status) => {
    if (status === 'GENUINE' || status === 'SAFE') return <ShieldCheck size={14} />;
    if (status === 'SUSPICIOUS') return <AlertTriangle size={14} />;
    return <ShieldAlert size={14} />;
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
      <div style={{ color: 'var(--text-muted)' }}>AI analyzing call logs...</div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }' }} />
    </div>
  );

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={20} /> AI Call Monitor
        </h1>

        <button
          onClick={() => { setIsCalling(true); setTranscript(''); setLiveResult(null); }}
          className="btn"
          style={{
            backgroundColor: 'var(--color-green)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', padding: '1rem'
          }}
        >
          <PhoneIncoming size={20} /> Simulate Incoming Call
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Safe', 'Suspicious', 'Fraud'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none',
                fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: filter === f ? 'var(--color-maroon)' : 'var(--border-color)',
                color: filter === f ? '#ffffff' : 'var(--text-main)'
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredItems.map((item) => (
          <div key={item.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} /> {item.sender}
                </div>
                <div className="list-item-subtitle" style={{ fontStyle: 'italic', margin: '0.4rem 0' }}>
                  "{item.text && item.text.length > 80 ? item.text.substring(0, 80) + '...' : (item.text || 'Empty transcript')}"
                </div>
                <div className="list-item-subtitle" style={{ opacity: 0.6, fontSize: '0.75rem' }}>{item.timestamp}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', marginLeft: '0.75rem' }}>
                <div className={`status-badge ${getBadgeClass(item.status)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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

            {/* AI Details */}
            {item.explanation && (
              <div style={{
                marginTop: '0.6rem', padding: '0.6rem', borderRadius: '8px',
                backgroundColor: 'var(--bg-color)', fontSize: '0.8rem', color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
              }}>
                <strong>🧠 AI:</strong> {item.explanation}
              </div>
            )}

            {item.reasons && item.reasons.length > 0 && item.status !== 'GENUINE' && item.status !== 'SAFE' && (
              <div style={{
                marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)',
                borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)',
              }}>
                <strong>Flags:</strong> {item.reasons.join(' · ')}
              </div>
            )}

            {/* Feedback */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              marginTop: '0.5rem', gap: '0.4rem',
            }}>
              {feedbackIds.has(item.id) ? (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-green)', fontWeight: '600' }}>✓ Feedback recorded</span>
              ) : (
                <>
                  <button onClick={() => handleFeedback(item, true)}
                    style={{
                      padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #bbf7d0',
                      backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.2rem',
                    }}>
                    <ThumbsUp size={10} /> Correct
                  </button>
                  <button onClick={() => handleFeedback(item, false)}
                    style={{
                      padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #fecaca',
                      backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.2rem',
                    }}>
                    <ThumbsDown size={10} /> Wrong
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No calls found for this filter.
          </div>
        )}
      </div>

      {/* --- LIVE CALL SIMULATION OVERLAY --- */}
      {isCalling && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#000000cc', zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '100%', maxWidth: '400px', background: 'white', borderRadius: '32px',
            padding: '2.5rem', color: 'black',
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '1.1rem', color: '#666', fontWeight: '500' }}>Incoming Call</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.75rem 0', letterSpacing: '-1px' }}>+91 98765-43210</div>
              <div style={{ display: 'inline-block', backgroundColor: '#f0f0f5', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>
                Punjab Sindh Region
              </div>
            </div>

            {/* Live Analysis Panel */}
            <div style={{
              padding: '1.5rem', borderRadius: '24px',
              backgroundColor: liveResult
                ? (liveResult.status === 'FRAUD' ? 'var(--color-maroon-light)' : liveResult.status === 'SUSPICIOUS' ? 'var(--color-yellow-light)' : '#f0fdf4')
                : '#f9f9f9',
              border: `2px dashed ${liveResult
                ? (liveResult.status === 'FRAUD' ? 'var(--color-maroon)' : liveResult.status === 'SUSPICIOUS' ? 'var(--color-yellow)' : 'var(--color-green)')
                : '#ddd'}`,
              marginBottom: '1.5rem', minHeight: '160px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}>
              {!isListening ? (
                <button onClick={startAnalysis} className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem' }}>
                  <Brain size={22} /> Start AI Analysis
                </button>
              ) : (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    marginBottom: '0.75rem', fontWeight: '800', fontSize: '0.9rem',
                    color: liveResult?.status === 'FRAUD' ? 'var(--color-maroon)' : 'var(--color-green)',
                  }}>
                    <div className="mic-pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                    {liveResult ? (
                      liveResult.status === 'FRAUD' ? `🚨 FRAUD DETECTED (${liveResult.fraud_probability}%)` :
                      liveResult.status === 'SUSPICIOUS' ? `⚠️ SUSPICIOUS (${liveResult.fraud_probability}%)` :
                      `✅ SAFE (${liveResult.fraud_probability}% risk)`
                    ) : 'LISTENING...'}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#333', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    "{transcript || "Listening for speech..."}"
                  </div>

                  {/* AI Analyze Button */}
                  <button
                    onClick={analyzeCallWithAI}
                    disabled={analyzing || !transcript.trim()}
                    className="btn"
                    style={{
                      backgroundColor: '#1e40af', color: 'white', fontSize: '0.85rem',
                      padding: '0.6rem', borderRadius: '12px', marginBottom: '0.5rem',
                      opacity: analyzing ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}
                  >
                    <Brain size={16} /> {analyzing ? 'AI Analyzing...' : 'Run AI Analysis'}
                  </button>

                  {/* AI Result in overlay */}
                  {liveResult && liveResult.explanation && (
                    <div style={{
                      fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.9)',
                      padding: '0.6rem', borderRadius: '12px', marginTop: '0.5rem',
                      fontWeight: '500', color: '#333', lineHeight: '1.4', textAlign: 'left',
                    }}>
                      🧠 {liveResult.explanation}
                    </div>
                  )}

                  {liveResult && liveResult.reasons && liveResult.reasons.length > 0 && (
                    <div style={{
                      fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.9)',
                      padding: '0.5rem', borderRadius: '10px', marginTop: '0.4rem',
                      fontWeight: '600', textAlign: 'left',
                      color: liveResult.status === 'FRAUD' ? 'var(--color-maroon)' : '#854d0e',
                    }}>
                      {liveResult.reasons.map((r, i) => (
                        <div key={i}>• {r}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button onClick={stopCall} className="btn"
              style={{
                backgroundColor: '#ff3b30', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.6rem', borderRadius: '50px', padding: '1.2rem', width: '100%',
              }}>
              <Phone size={24} style={{ transform: 'rotate(135deg)' }} /> End Call
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mic-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mic-pulse { animation: mic-pulse 1.2s ease-in-out infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

export default Calls;
