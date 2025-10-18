import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../../UserContext.jsx';
import MessageInput from './MessageInput.jsx';

export default function MessagesThread({ patientId: propPatientId }) {
  const { id: routePatientId } = useParams(); // works for /patient/:id/messages or /patients/:id/messages
  const patientId = propPatientId ?? Number(routePatientId);
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [header, setHeader] = useState({ name: '', role: '' });
  const bottomRef = useRef(null);

  const apiBase = useMemo(() => import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000', []);

  const fetchThread = async () => {
    try {
      const res = await fetch(`${apiBase}/api/messages/thread/${patientId}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      // Mark messages from the other party as read
      const mine = user.role === 'doctor' ? 'doctor' : 'patient';
      const unreadIncoming = (Array.isArray(data) ? data : []).filter(
        (m) => m.sender_type !== mine && !m.read_at
      );
      for (const m of unreadIncoming) {
        try {
          await fetch(`${apiBase}/api/messages/${m.id}/read`, { method: 'PATCH' });
        } catch (_) { /* non-blocking */ }
      }
    } catch (e) {
      console.error('fetch thread failed', e);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const onClear = async () => {
    if (!patientId) return;
    const ok = confirm('Clear entire conversation? This cannot be undone.');
    if (!ok) return;
    try {
      setClearing(true);
      const res = await fetch(`${apiBase}/api/messages/thread/${patientId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('clear failed');
      setItems([]);
    } catch (e) {
      console.error(e);
      alert('Failed to clear conversation');
    } finally {
      setClearing(false);
    }
  };

  // Fetch header context (doctor name) for patient
  const fetchHeader = async () => {
    try {
      if (user.role !== 'patient') return;
      const res = await fetch(`${apiBase}/api/patients/${patientId}/doctor`);
      if (!res.ok) return;
      const info = await res.json();
      const name = info?.name || info?.doctor?.name || 'Your Doctor';
      setHeader({ name, role: 'Doctor', id: info?.id || info?.doctor?.id || null });
    } catch (_) {}
  };

  const scrollToBottom = () => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setLoading(true);
    fetchThread();
    fetchHeader();
    const t = setInterval(fetchThread, 10000); // 10s polling
    return () => clearInterval(t);
  }, [patientId]);

  const onSend = async (text) => {
    try {
      setSending(true);
      const res = await fetch(`${apiBase}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, sender_type: user.role === 'doctor' ? 'doctor' : 'patient', body: text })
      });
      if (!res.ok) throw new Error('send failed');
      await fetchThread();
    } catch (e) {
      console.error(e);
      alert('Failed to send message');
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const mineType = user.role === 'doctor' ? 'doctor' : 'patient';

  return (
    <div className="flex flex-col flex-1">
      {/* Header shows doctor for patient */}
      <div className="flex items-center justify-between mb-3">
        {user.role === 'patient' ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">
              {(header.name || 'D').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800">{header.name || 'Your Doctor'}</div>
              <div className="text-[11px] text-emerald-600 font-medium">{header.role || 'Doctor'}</div>
            </div>
          </div>
        ) : (
          <div className="text-lg font-semibold">Messages</div>
        )}
        <button
          onClick={onClear}
          disabled={clearing}
          className="ml-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          {clearing ? 'Clearing…' : 'Clear chat'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-emerald-100/60 p-4 bg-gradient-to-b from-white to-emerald-50/20">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">No messages yet.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((m) => (
              <li key={m.id} className={`max-w-[70%] ${m.sender_type === mineType ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                <div className={`inline-block rounded-2xl px-3 py-2 shadow-sm ${m.sender_type === mineType ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white border border-emerald-100/60 rounded-tl-sm'}`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</div>
                  <div className="mt-1 text-[11px] opacity-80">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="mt-4 pt-3 border-t border-emerald-100/60">
        <MessageInput onSend={onSend} disabled={sending} />
      </div>
    </div>
  );
}
