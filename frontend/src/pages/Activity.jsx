import React, { useEffect, useState } from 'react';

function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/get-activity-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Backend not reachable, loading local logs', err);
        const local = localStorage.getItem('pn_activity_logs');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setLogs(parsed);
          } catch (e) {
            setLogs([{id: 1, timestamp: "2026-04-19 10:00", action: "Fallback: Scanned email", result: "SAFE"}]);
          }
        } else {
          setLogs([{id: 1, timestamp: "2026-04-19 10:00", action: "Fallback: Scanned email", result: "SAFE"}]);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading activity logs...</div>;

  return (
    <div>
      <h1 className="page-title">Activity Logs</h1>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.map((log) => {
          const isFraud = log.result.toLowerCase().includes('fraud');
          return (
            <div key={log.id} className="list-item">
              <div style={{flex: 1}}>
                <div className="list-item-title">{log.action}</div>
                <div className="list-item-subtitle">{log.timestamp}</div>
              </div>
              <div style={{marginLeft: '1rem'}}>
                <div className={`status-badge ${isFraud ? 'status-fraud' : 'status-safe'}`}>
                  {log.result}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Activity;
