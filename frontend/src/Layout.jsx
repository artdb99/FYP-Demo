import { NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from './UserContext'; // 1. import context
import { BarChart3, ShieldCheck, Users, UserPlus, Activity, LineChart, Stethoscope, Settings, LogOut, MessageCircle, User as UserIcon, PanelLeft, PanelLeftClose, Bell } from 'lucide-react';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useUser(); // 2. get role from context

  if (!user) return <div className="p-6">Please sign in.</div>; // fallback

  const isOpen = !collapsed;
  const role = (user?.role || '').toLowerCase();

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <RoleHeaderBar role={role} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`relative z-20 flex flex-col h-full overflow-y-auto overflow-x-visible transition-all duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-6'} bg-gradient-to-b from-emerald-500/70 via-emerald-500/60 to-cyan-500/60 text-white shadow-xl backdrop-blur-md border-r border-white/20`}
          style={
            isOpen
              ? { width: 'fit-content', minWidth: 216, maxWidth: 280 }
              : { width: 88 }
          }
          aria-label="Primary"
        >
          <div className={`flex items-center border-b border-white/20 ${isOpen ? 'justify-center px-3 py-3' : 'justify-center pl-8 pr-4 py-3'}`}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-white/90 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={isOpen}
            >
              {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <nav className="flex-1 mt-2 overflow-visible">
          {/* Doctor Sidebar */}
          {role === 'doctor' && (
            <div className={`${isOpen ? 'px-2' : 'px-0'}`}>
              <h3 className={`px-2 py-2 text-white/80 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>Your Patients</h3>
              <ul className={`space-y-1 overflow-visible ${!isOpen ? 'flex flex-col items-center' : ''}`}>
                <HoverAddPatientWrapper isOpen={isOpen} />
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '60ms' : '0ms' }}>
                  <NavItem to="/messages" icon={<MessageCircle size={18} />} label="Messages" isOpen={isOpen} />
                </li>
              </ul>

              <h3 className={`mt-3 px-2 py-2 text-white/80 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>Functions</h3>
              <ul className={`space-y-1 ${!isOpen ? 'flex flex-col items-center' : ''}`}>
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '80ms' : '0ms' }}>
                  <NavItem to="/predict" icon={<LineChart size={18} />} label="Risk Prediction" isOpen={isOpen} />
                </li>
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}>
                  <NavItem to="/therapy-effectiveness" icon={<Activity size={18} />} label="Therapy Effectiveness" isOpen={isOpen} />
                </li>
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '120ms' : '0ms' }}>
                  <NavItem to="/treatment-recommendation" icon={<Stethoscope size={18} />} label="Treatment Recommendation" isOpen={isOpen} />
                </li>
              </ul>
            </div>
          )}

          {/* Patient Sidebar */}
          {role === 'patient' && (
            <div className={`${isOpen ? 'px-2' : 'px-0'}`}>
              <h3 className={`px-2 py-2 text-white/80 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>My Account</h3>
              <ul className={`space-y-1 ${!isOpen ? 'flex flex-col items-center' : ''}`}>
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '60ms' : '0ms' }}>
                  <NavItem to="/profile" icon={<UserIcon size={18} />} label="My Profile" isOpen={isOpen} />
                </li>
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '80ms' : '0ms' }}>
                  <NavItem to="/messages" icon={<MessageCircle size={18} />} label="Messages" isOpen={isOpen} />
                </li>
              </ul>

              <h3 className={`mt-3 px-2 py-2 text-white/80 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>Support</h3>
              <ul className={`space-y-1 ${!isOpen ? 'flex flex-col items-center' : ''}`}>
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '60ms' : '0ms' }}>
                  <NavItem to="/chatbot" icon={<MessageCircle size={18} />} label="Chat with Bot" isOpen={isOpen} />
                </li>
              </ul>
            </div>
          )}

          {/* Admin Sidebar */}
          {role === 'admin' && (
            <div className={`${isOpen ? 'px-2' : 'px-0'}`}>
              <ul className="space-y-1 mt-2">
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '60ms' : '0ms' }}>
                  <NavItem to="/admin/users" icon={<Settings size={18} />} label="Manage Users" isOpen={isOpen} />
                </li>
                <li className={`transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-0'}`} style={{ transitionDelay: isOpen ? '80ms' : '0ms' }}>
                  <NavItem to="/admin/patients" icon={<Users size={18} />} label="Manage Patients" isOpen={isOpen} />
                </li>
              </ul>
            </div>
          )}
        </nav>

          <div className={`mt-auto border-t border-white/20 ${isOpen ? 'p-3' : 'py-3 pl-12 pr-0'}`}>
            <button
              onClick={logout}
              className={`flex items-center justify-center rounded-md transition text-white/90 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${isOpen ? 'w-full gap-2 px-3 py-2' : 'gap-0 py-2'}`}
              aria-label="Log Out"
              title="Log Out"
            >
              <LogOut size={18} />
              {isOpen && <span className="text-sm font-semibold tracking-wide">Log Out</span>}
            </button>
          </div>

        </aside>

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto px-6 py-8 text-gray-900 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-1' : 'translate-x-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;

function RoleHeaderBar({ role }) {
  const { user } = useUser();
  const fullName = user?.name || '';
  const firstName = fullName.split(' ')[0] || ''; 

  const roleMeta = {
    admin: {
      gradient: 'from-purple-500/90 via-purple-400/80 to-rose-400/80',
      iconBg: 'bg-white/15 text-white',
      icon: <ShieldCheck size={18} />,
      settingsPath: '/admin/settings',
    },
    doctor: {
      gradient: 'from-emerald-500/90 to-cyan-500/80',
      iconBg: 'bg-white/15 text-white',
      icon: <Stethoscope size={18} />,
      settingsPath: '/doctor/settings',
    },
    patient: {
      gradient: 'from-sky-500/90 via-blue-400/80 to-indigo-500/80',
      iconBg: 'bg-white/15 text-white',
      icon: <BarChart3 size={18} />,
      settingsPath: '/patient/settings',
    },
    default: {
      label: 'Welcome',
      badge: 'Workspace',
      gradient: 'from-slate-500/90 via-slate-400/80 to-slate-500/80',
      iconBg: 'bg-white/15 text-white',
      icon: <Users size={18} />,
    },
  };
  const meta = roleMeta[role] || roleMeta.default;

  return (
    <header className="w-full border-b border-emerald-100/60 bg-gradient-to-r from-white via-emerald-50 to-cyan-50 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3 text-slate-700">
        <div className="flex items-center gap-4">
          <img
            src="/biotective-logo.png"
            alt="BIOTECTIVE"
            className="h-9 drop-shadow-sm"
            onError={(e)=>{ e.currentTarget.style.display='none'; }}
          />
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.iconBg} shadow-sm`}> 
            {meta.icon}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-500 font-semibold">{meta.badge}</p>
            <h2 className="text-lg font-semibold leading-tight text-slate-800">{meta.label}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role={role} />
          <NotificationBell />
          <NavLink
            to={meta.settingsPath}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow text-emerald-500 hover:bg-emerald-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            title="Settings"
          >
            <Settings size={18} />
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function RoleBadge({ role }) {
  const { user } = useUser();
  const fullName = user?.name || '';
  const firstName = fullName.split(' ')[0] || '';

  let label = firstName || 'User';
  let circleBg = 'bg-blue-100';
  let circleText = 'text-blue-700';
  if (role === 'admin') {
    label = 'Admin';
    circleBg = 'bg-purple-100';
    circleText = 'text-purple-700';
  } else if (role === 'doctor') {
    label = `Dr. ${firstName || 'User'}`;
    circleBg = 'bg-green-100';
    circleText = 'text-green-700';
  } else if (role === 'patient') {
    label = firstName || 'Patient';
    circleBg = 'bg-sky-100';
    circleText = 'text-sky-700';
  }

  const initial = (firstName?.[0] || 'A').toUpperCase();

  return (
    <div className="inline-flex items-center gap-3 px-3 py-2 rounded-full bg-white/20 backdrop-blur border border-white/40 text-black">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${circleBg} ${circleText}`}>
        {initial}
      </div>
      <div className="text-sm font-semibold tracking-tight">
        {label}
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, isOpen }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center ${isOpen ? 'gap-3 px-3 py-2 justify-start' : 'gap-0 pl-8 pr-4 py-2.5 justify-center'} rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
          isActive ? 'bg-white text-purple-700 font-semibold' : 'text-white/90 hover:bg-white/10'
        }`}
      title={!isOpen ? label : undefined}
      aria-label={label}
    >
      <span className="shrink-0">{icon}</span>
      {isOpen && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiBase = (import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  const fetchCount = async () => {
    try {
      const res = await fetch(`${apiBase}/api/notifications/unread-count?user_id=${user.id}`);
      const data = await res.json();
      setUnread(Number(data?.unread || 0));
    } catch (_) {}
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/notifications?user_id=${user.id}&unread=1`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (open) fetchList();
  }, [open]);

  const goto = async (n) => {
    const pid = n?.data?.patient_id;
    if (!pid) return;
    const path = user.role === 'doctor' ? `/patients/${pid}/messages` : `/patient/${pid}/messages`;
    // mark this notification as read
    try {
      const apiBase = (import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
      await fetch(`${apiBase}/api/notifications/${n.id}/read`, { method: 'PATCH' });
      // refresh unread count optimistically
      setUnread((u) => Math.max(0, u - 1));
    } catch (_) {}

    window.location.hash = '#';
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow text-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-md bg-white shadow-lg border border-emerald-100 z-50">
          <div className="px-3 py-2 text-sm font-semibold text-emerald-700 border-b flex items-center justify-between">
            <span>Notifications</span>
            <button
              onClick={async () => {
                try {
                  const apiBase = (import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
                  await fetch(`${apiBase}/api/notifications/mark-all-read?user_id=${user.id}`, { method: 'PATCH' });
                  setUnread(0);
                  setItems([]);
                } catch (_) {}
              }}
              className="text-[11px] font-normal text-emerald-600 hover:text-emerald-700"
              title="Mark all as read"
            >
              Mark all as read
            </button>
          </div>
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No new notifications</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className="p-3 text-sm hover:bg-emerald-50 cursor-pointer" onClick={() => goto(n)}>
                  <div className="font-medium text-slate-800">New message</div>
                  <div className="text-slate-600 line-clamp-2">{n?.data?.snippet || 'New message received'}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Portal-based hover wrapper for the Patients item, rendering an "Add Patient" chip to the right
function HoverAddPatientWrapper({ isOpen }) {
  const liRef = useRef(null);
  const [mounted, setMounted] = useState(false); // render portal
  const [show, setShow] = useState(false);       // animate opacity
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const hideTimerRef = useRef();

  // Recompute chip position when shown or on window resize/scroll
  useEffect(() => {
    if (!mounted || !liRef.current) return;
    const update = () => {
      const el = liRef.current;
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 12 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [mounted]);

  const openChip = () => {
    clearTimeout(hideTimerRef.current);
    setMounted(true);
    // allow portal to mount before animating
    requestAnimationFrame(() => setShow(true));
  };

  const scheduleClose = () => {
    clearTimeout(hideTimerRef.current);
    setShow(false);
    hideTimerRef.current = setTimeout(() => setMounted(false), 160);
  };

  const chip = (
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateY(-50%)' }}
      className={`z-[9999] transition-opacity duration-150 ${show ? 'opacity-100' : 'opacity-0'}`}
      onMouseEnter={openChip}
      onMouseLeave={scheduleClose}
    >
      <NavLink
        to="/patients/create"
        className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-purple-700 bg-white shadow-md font-medium text-sm hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40 border border-purple-100"
        onMouseEnter={openChip}
        onMouseLeave={scheduleClose}
      >
        <UserPlus size={16} />
        <span>Add Patient</span>
      </NavLink>
    </div>
  );

  return (
    <li
      ref={liRef}
      className="relative"
      onMouseEnter={openChip}
      onMouseLeave={scheduleClose}
      onFocus={openChip}
      onBlur={scheduleClose}
    >
      <NavItem to="/patients" icon={<Users size={18} />} label="List of Patients" isOpen={isOpen} />
      {mounted && createPortal(chip, document.body)}
    </li>
  );
}
