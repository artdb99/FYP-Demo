import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../UserContext.jsx';
import { MessageCircle, Search } from 'lucide-react';
import Card from '../../components/Card.jsx';
import MessagesThread from './MessagesThread.jsx';

export default function MessagesPage() {
  const { user } = useUser();
  const { id: activeIdParam } = useParams();
  const activePatientId = activeIdParam ? Number(activeIdParam) : null;
  const navigate = useNavigate();
  const apiBase = useMemo(() => (import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000').replace(/\/$/, ''), []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initDone, setInitDone] = useState(false);
  const [q, setQ] = useState('');
  const lastSigRef = useRef('');

  // For patient role: resolve their own patient_id to chat with assigned doctor
  const [myPatientId, setMyPatientId] = useState(null);
  const [patientResolving, setPatientResolving] = useState(false);

  const fetchConversations = async () => {
    try {
      if (!initDone) setLoading(true);
      const url = `${apiBase}/api/messages/conversations?user_id=${user.id}&role=${user.role}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Build a lightweight signature to avoid unnecessary re-renders
        const sig = JSON.stringify(
          data.map((d) => ({
            id: d.patient_id,
            lm: d.last_message_at,
            uc: d.unread_count,
          }))
        );
        if (sig !== lastSigRef.current) {
          lastSigRef.current = sig;
          setItems(data);
        }
      }
    } catch (e) {
      console.error('fetch conversations failed', e);
    } finally {
      if (!initDone) setLoading(false);
      setInitDone(true);
    }
  };

  useEffect(() => {
    if (user?.role === 'patient') return; // patients don't need conversation polling
    let t;
    const tick = () => {
      if (document.hidden) return;
      fetchConversations();
    };
    tick();
    t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role !== 'patient' || !user?.id) return;
    let cancelled = false;
    const run = async () => {
      try {
        setPatientResolving(true);
        const res = await fetch(`${apiBase}/api/patients/by-user/${user.id}`);
        if (!res.ok) return;
        const p = await res.json();
        if (cancelled) return;
        if (p && p.id) {
          setMyPatientId(Number(p.id));
        }
      } finally {
        if (!cancelled) setPatientResolving(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [user?.id, user?.role, apiBase]);

  const filtered = items.filter((x) =>
    !q.trim() || String(x.patient_name || '').toLowerCase().includes(q.trim().toLowerCase())
  );

  const openThread = (pid) => navigate(`/messages/${pid}`);

  // If patient: single-thread view with their doctor only
  if (user?.role === 'patient') {
    return (
      <div className="w-full px-6 md:px-8 lg:px-10 py-6">
        <Card className="rounded-2xl bg-white shadow-md ring-1 ring-emerald-100/60 px-5 py-5 h-[calc(100vh-180px)] flex flex-col">
          {patientResolving ? (
            <div className="text-gray-500">Loading...</div>
          ) : myPatientId ? (
            <MessagesThread patientId={myPatientId} />
          ) : (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={48} className="mb-3 opacity-40" />
              <p className="text-sm">We couldn't find your patient profile.</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Doctor/admin view (unchanged)
  return (
    <div className="w-full px-6 md:px-8 lg:px-10 py-6 space-y-4">
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        {/* Left: conversations */}
        <Card className="col-span-12 md:col-span-4 lg:col-span-3 rounded-2xl bg-white shadow-md ring-1 ring-emerald-100/60 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50/50 to-cyan-50/50">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <MessageCircle size={18} />
              <h3 className="text-sm font-semibold tracking-tight">Conversations</h3>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-emerald-200/60 bg-white pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No conversations</div>
            ) : (
              <ul>
                {filtered.map((c) => (
                  <li key={c.patient_id}>
                    <button
                      onClick={() => openThread(c.patient_id)}
                      className={`w-full text-left px-4 py-3 border-b border-emerald-50/60 hover:bg-emerald-50/60 transition flex items-start gap-3 ${activePatientId === c.patient_id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {(c.patient_name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="font-semibold text-slate-800 truncate">{c.patient_name}</div>
                          {c.last_message_at && (
                            <div className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          )}
                        </div>
                        {c.last_message_snippet && (
                          <div className="text-xs text-slate-600 truncate">{c.last_message_snippet}</div>
                        )}
                        {c.unread_count > 0 && (
                          <span className="mt-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] rounded-full bg-rose-500 text-white px-1.5 font-semibold">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Middle: thread */}
        <Card className="col-span-12 md:col-span-8 lg:col-span-9 rounded-2xl bg-white shadow-md ring-1 ring-emerald-100/60 px-5 py-5 h-full flex flex-col">
          {activePatientId ? (
            <MessagesThread />
          ) : (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={48} className="mb-3 opacity-40" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
