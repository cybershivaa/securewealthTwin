import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Brain, Zap, Activity, MessageSquare, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';

function Detection() {
  const [content, setContent] = useState('');
  const [msgType, setMsgType] = useState('email');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiReady, setAiReady] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(r => r.json())
      .then(d => setAiReady(d.ai_engine))
      .catch(() => setAiReady('offline'));
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setFeedbackSent(false);
    setShowDetails(false);

    let finalStatus = "GENUINE";
    try {
      const response = await fetch('http://localhost:8000/analyze-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_text: content, source_type: msgType })
      });
      const data = await response.json();
      setResult(data);
      finalStatus = data.status;
    } catch (err) {
      console.error(err);
      setResult({
        status: "GENUINE",
        reasons: [],
        suggestion: "⚠️ AI Engine not reachable. Please ensure the backend is running.",
        fraud_probability: 0,
        confidence: 0,
        explanation: "Could not connect to the AI analysis engine.",
        risk_level: "SAFE",
      });
      finalStatus = "GENUINE";
    }
    setLoading(false);

    // Add to activity logs
    const local = localStorage.getItem('pn_activity_logs');
    let logs = [];
    if (local) { try { logs = JSON.parse(local); } catch (e) {} }
    logs.unshift({
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      action: `AI ${msgType.toUpperCase()} Scan`,
      result: finalStatus
    });
    localStorage.setItem('pn_activity_logs', JSON.stringify(logs));
  };

  const handleFeedback = async (isCorrect, userClassification) => {
    if (!result || feedbackSent) return;
    try {
      await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_text: content,
          source_type: msgType,
          ai_classification: result.status,
          user_classification: userClassification || result.status,
          is_correct: isCorrect,
          fraud_probability: result.fraud_probability || 0,
        })
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Feedback submission failed:', err);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'GENUINE') return <ShieldCheck size={20} />;
    if (status === 'SUSPICIOUS') return <AlertTriangle size={20} />;
    return <ShieldAlert size={20} />;
  };

  const getStatusColor = (status) => {
    if (status === 'GENUINE') return 'var(--color-green)';
    if (status === 'SUSPICIOUS') return 'var(--color-yellow)';
    return 'var(--color-maroon)';
  };

  const getRiskBg = (level) => {
    const map = {
      CRITICAL: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      HIGH: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
      MEDIUM: 'linear-gradient(135deg, #ca8a04 0%, #854d0e 100%)',
      LOW: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      SAFE: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    };
    return map[level] || map.SAFE;
  };

  return (
    <div>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Brain size={22} /> AI Detection
      </h1>

      {/* AI Status Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
        marginBottom: '1rem',
        backgroundColor: aiReady === 'ready' ? '#dcfce7' : aiReady === 'loading' ? '#fef9c3' : '#fee2e2',
        color: aiReady === 'ready' ? '#166534' : aiReady === 'loading' ? '#854d0e' : '#991b1b',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: aiReady === 'ready' ? '#16a34a' : aiReady === 'loading' ? '#ca8a04' : '#dc2626',
          animation: aiReady === 'loading' ? 'pulse-dot 1.5s infinite' : 'none',
        }} />
        {aiReady === 'ready' ? 'AI Engine Online' : aiReady === 'loading' ? 'AI Loading...' : 'AI Offline'}
      </div>

      {/* Analysis Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              Communication Type
            </label>
            <select
              className="input-field"
              value={msgType}
              onChange={(e) => setMsgType(e.target.value)}
              style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)' }}
            >
              <option value="email">📧 Email</option>
              <option value="sms">💬 SMS</option>
              <option value="voice_call">📞 Voice Call Transcript</option>
              <option value="internet_call">🌐 Internet/VoIP Call Transcript</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              Message Content
            </label>
            <textarea
              className="input-field"
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste any message, email body, SMS, or call transcript here for AI analysis..."
              required
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !content.trim()}
            style={{
              alignSelf: 'flex-start',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <><Zap size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
            ) : (
              <><Brain size={16} /> Analyze with AI</>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Risk Level Banner */}
          <div style={{
            background: getRiskBg(result.risk_level),
            borderRadius: '16px', padding: '1.25rem', color: 'white',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Risk Level
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(result.status)} {result.risk_level || result.status}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: '900', lineHeight: 1 }}>
                {result.fraud_probability ?? 0}%
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Fraud Probability</div>
            </div>
          </div>

          {/* Confidence & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Classification</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: getStatusColor(result.status), marginTop: '0.25rem' }}>
                {result.status}
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Confidence</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '0.25rem' }}>
                {result.confidence ?? 0}%
              </div>
            </div>
          </div>

          {/* Explanation */}
          {result.explanation && (
            <div className="card" style={{ borderLeft: `4px solid ${getStatusColor(result.status)}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <MessageSquare size={16} />
                <strong style={{ fontSize: '0.9rem' }}>AI Explanation</strong>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                {result.explanation}
              </p>
            </div>
          )}

          {/* Detection Reasons */}
          {result.reasons && result.reasons.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <ShieldAlert size={16} />
                <strong style={{ fontSize: '0.9rem' }}>Detection Flags</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {result.reasons.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: '8px',
                    backgroundColor: 'var(--bg-color)', fontSize: '0.85rem',
                    color: 'var(--text-main)',
                  }}>
                    <span style={{ color: getStatusColor(result.status), fontWeight: '700', flexShrink: 0 }}>•</span>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestion */}
          {result.suggestion && (
            <div className="card" style={{
              backgroundColor: result.status === 'FRAUD' ? 'var(--color-maroon-light)' :
                result.status === 'SUSPICIOUS' ? 'var(--color-yellow-light)' : '#f0fdf4',
              border: `1px solid ${getStatusColor(result.status)}22`,
            }}>
              <strong style={{ fontSize: '0.85rem' }}>Recommendation</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {result.suggestion}
              </p>
            </div>
          )}

          {/* Detailed Analysis (Expandable) */}
          {result.analysis_details && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  width: '100%', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} /> Detailed AI Analysis
                </span>
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDetails && (
                <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Intent */}
                  {result.analysis_details.intent && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🎯 Detected Intent
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                        {result.analysis_details.intent.primary}
                        <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          ({result.analysis_details.intent.confidence}% confident)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tone */}
                  {result.analysis_details.tone && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🎭 Tone Analysis
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(result.analysis_details.tone.all_tones || []).map((t, i) => (
                          <span key={i} style={{
                            padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                            backgroundColor: i === 0 ? `${getStatusColor(result.status)}18` : 'var(--bg-color)',
                            color: i === 0 ? getStatusColor(result.status) : 'var(--text-muted)',
                            border: `1px solid ${i === 0 ? getStatusColor(result.status) + '33' : 'var(--border-color)'}`,
                          }}>
                            {t.tone} · {t.score}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manipulation Patterns */}
                  {result.analysis_details.manipulation?.patterns_detected?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🕵️ Manipulation Patterns
                      </div>
                      {result.analysis_details.manipulation.patterns_detected.map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.4rem 0', fontSize: '0.85rem',
                          borderBottom: i < result.analysis_details.manipulation.patterns_detected.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                          <span>{p.pattern}</span>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: '700',
                            color: p.confidence > 60 ? 'var(--color-maroon)' : 'var(--text-muted)',
                          }}>
                            {p.confidence}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sentiment */}
                  {result.analysis_details.sentiment && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        💭 Sentiment
                      </div>
                      <span style={{
                        padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                        backgroundColor: result.analysis_details.sentiment.label === 'NEGATIVE' ? '#fee2e2' : '#dcfce7',
                        color: result.analysis_details.sentiment.label === 'NEGATIVE' ? '#991b1b' : '#166534',
                      }}>
                        {result.analysis_details.sentiment.label} · {result.analysis_details.sentiment.score}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          <div className="card" style={{ textAlign: 'center' }}>
            {feedbackSent ? (
              <div style={{ color: 'var(--color-green)', fontWeight: '600', fontSize: '0.9rem' }}>
                ✓ Thank you for your feedback! This helps improve our AI.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Was this analysis accurate?
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleFeedback(true)}
                    className="btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
                      padding: '0.5rem 1rem', fontSize: '0.85rem',
                    }}
                  >
                    <ThumbsUp size={14} /> Yes, Correct
                  </button>
                  <button
                    onClick={() => {
                      const correction = result.status === 'FRAUD' ? 'GENUINE' : 'FRAUD';
                      handleFeedback(false, correction);
                    }}
                    className="btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                      padding: '0.5rem 1rem', fontSize: '0.85rem',
                    }}
                  >
                    <ThumbsDown size={14} /> No, Incorrect
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}} />
    </div>
  );
}

export default Detection;
