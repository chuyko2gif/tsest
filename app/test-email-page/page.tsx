'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sendTestEmail = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setResult({ status: res.status, ...data });
    } catch (err: any) {
      setResult({ error: err.message });
    }
    
    setLoading(false);
  };

  const checkDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-email');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', maxWidth: 800, margin: '0 auto' }}>
      <h1>🧪 Тест Email</h1>
      
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={checkDiagnostics}
          disabled={loading}
          style={{ padding: '10px 20px', marginRight: 10, cursor: 'pointer' }}
        >
          📊 Диагностика
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите email для теста"
          style={{ padding: 10, width: 300, marginRight: 10 }}
        />
        <button 
          onClick={sendTestEmail}
          disabled={loading || !email}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          📧 Отправить тестовое письмо
        </button>
      </div>

      {loading && <p>Загрузка...</p>}

      {result && (
        <pre style={{ 
          background: '#1a1a2e', 
          color: '#0f0', 
          padding: 20, 
          borderRadius: 8,
          overflow: 'auto',
          maxHeight: 500
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      <hr style={{ margin: '30px 0' }} />
      
      <h2>❓ Частые проблемы</h2>
      <ul>
        <li><strong>Письмо не приходит</strong> - проверь папку СПАМ</li>
        <li><strong>Invalid sender</strong> - email отправителя не верифицирован в Brevo</li>
        <li><strong>Authentication failed</strong> - неверный SMTP_USER или SMTP_PASS</li>
      </ul>
    </div>
  );
}
