import { NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from './UserContext'; // 1. import context
import { Users, UserPlus, Activity, LineChart, Stethoscope, Settings, LogOut, MessageCircle, User as UserIcon, PanelLeft, PanelLeftClose } from 'lucide-react';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useUser(); // 2. get role from context

  if (!user) return <div className="p-6">Please sign in.</div>; // fallback

  const isOpen = !collapsed;

  return (
    <div className="flex h-screen w-screen overflow-y-hidden overflow-x-visible bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`relative z-30 flex flex-col h-full overflow-y-auto overflow-x-visible transition-all duration-300 bg-gradient-to-b from-teal-300 to-green-500 text-white shadow-xl`}
        style={{ width: isOpen ? 288 : 88 }}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/20">
          <div className={`flex items-center gap-2 ${isOpen ? 'flex-1 justify-center' : 'w-full justify-center'}`}> 
            <img src="/biotective-logo.png" alt="BIOTECTIVE" className={`h-8 object-contain drop-shadow ${!isOpen ? 'hidden' : ''}`} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
            {!isOpen && (
              <img
                src="/Biotective_Logo_Alone.png"
                alt="BIOTECTIVE"
                className="h-6 w-6 object-contain drop-shadow mx-auto"
                onError={(e)=>{ e.currentTarget.style.display='none'; }}
              />
            )}
          </div>
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
          {user.role === 'doctor' && (
            <div className="px-2">
              {isOpen && <h3 className="px-2 py-2 text-white/80 text-[11px] font-semibold uppercase tracking-wide">Your Patients</h3>}
              <ul className="space-y-1 overflow-visible">
                <HoverAddPatientWrapper isOpen={isOpen} />
              </ul>

              {isOpen && <h3 className="mt-3 px-2 py-2 text-white/80 text-[11px] font-semibold uppercase tracking-wide">Functions</h3>}
              <ul className="space-y-1">
                <li>
                  <NavItem to="/predict" icon={<LineChart size={18} />} label="Risk Prediction" isOpen={isOpen} />
                </li>
                <li>
                  <NavItem to="/therapy-effectiveness" icon={<Activity size={18} />} label="Therapy Effectiveness" isOpen={isOpen} />
                </li>
                <li>
                  <NavItem to="/treatment-recommendation" icon={<Stethoscope size={18} />} label="Treatment Recommendation" isOpen={isOpen} />
                </li>
              </ul>
            </div>
          )}

          {/* Patient Sidebar */}
          {user.role === 'patient' && (
            <div className="px-2">
              <ul className="space-y-1">
                <li>
                  <NavItem to="/profile" icon={<UserIcon size={18} />} label="My Profile" isOpen={isOpen} />
                </li>
                <li>
                  <NavItem to="/chatbot" icon={<MessageCircle size={18} />} label="Chat with Bot" isOpen={isOpen} />
                </li>
              </ul>
            </div>
          )}

          {/* Admin Sidebar */}
          {user.role === 'admin' && (
            <div className="px-2">
              <ul className="space-y-1 mt-2">
                <li>
                  <NavItem to="/admin/users" icon={<Settings size={18} />} label="Manage Users" isOpen={isOpen} />
                </li>
                <li>
                  <NavItem to="/admin/patients" icon={<Users size={18} />} label="Manage Patients" isOpen={isOpen} />
                </li>
              </ul>
            </div>
          )}
        </nav>

        <div className="mt-auto p-3 border-t border-white/20">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition text-white/90 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Log Out"
            title="Log Out"
          >
            <LogOut size={18} />
            {isOpen && <span>Log Out</span>}
          </button>
        </div>

      </aside>

      {/* No hover-to-peek handle: collapsed rail is always clickable */}

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full overflow-auto bg-gray-50">
        {/* Role badge at top-right */}
        <div className="fixed top-3 right-4 z-40">
          <RoleBadge role={user.role} />
        </div>
        <main className="flex-1 w-full px-6 py-8 text-gray-900">{children}</main>
      </div>
    </div>
  );
}

export default Layout;

function RoleBadge({ role }) {
  // Get current user's name from context for first-name display
  // We keep it self-contained by reusing useUser inside this component
  const { user } = useUser();
  const fullName = user?.name || '';
  const firstName = fullName.split(' ')[0] || '';

  let label = firstName;
  let circleBg = 'bg-blue-100';
  let circleText = 'text-blue-700';
  if (role === 'admin') {
    label = 'Admin';
    circleBg = 'bg-purple-100';
    circleText = 'text-purple-700';
  } else if (role === 'doctor') {
    label = `Dr. ${firstName}`;
    circleBg = 'bg-green-100';
    circleText = 'text-green-700';
  }
  const initial = (firstName?.[0] || 'A').toUpperCase();

  return (
    <div className="inline-flex items-center gap-3 px-3 py-2 rounded-full shadow-md bg-white/80 backdrop-blur border border-gray-200">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${circleBg} ${circleText}`}>
        {initial}
      </div>
      <div className="text-sm font-semibold text-gray-800">
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
        `flex items-center ${isOpen ? 'gap-3 px-3 py-2 justify-start' : 'gap-0 px-0 py-2 justify-center w-full'} rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
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
