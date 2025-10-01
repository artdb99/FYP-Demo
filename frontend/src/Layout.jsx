import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from './UserContext'; // 1. import context

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [peek, setPeek] = useState(false); // hover-to-peek
  const location = useLocation();
  const { user, logout } = useUser(); // 2. get role from context


  const isActive = (path) => location.pathname === path;

  if (!user) return <div className="p-6">Please sign in.</div>; // fallback

  const isOpen = !collapsed || peek;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
        className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-gradient-to-b from-teal-300 to-green-500 text-white shadow-xl overflow-hidden`}
        style={{ width: isOpen ? 256 : 0 }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/20">
          {isOpen && (
            <div className="flex-1 flex justify-center">
              {/* Logo: place file at frontend/public/biotective-logo.png */}
              <img src="/biotective-logo.png" alt="BIOTECTIVE" className="h-8 object-contain drop-shadow" onError={(e)=>{ e.currentTarget.style.display='none'; }} />
            </div>
          )}
        </div>

        <nav className="flex flex-col items-center space-y-4 pt-4">
          {isOpen && (
            <>
              {/* Doctor Sidebar */}
              {user.role === 'doctor' && (
                <>
                  <h3 className="text-white/70 text-xs font-bold uppercase"> Your Patients</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to="/patients"
                        className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/patients')
                          ? 'bg-white text-purple-700 font-bold'
                          : 'text-white/90 hover:bg-white/10'
                          }`}
                      >
                        List of Patients
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/patients/create"
                        className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/patients/create')
                          ? 'bg-white text-purple-700 font-bold'
                          : 'text-white/90 hover:bg-white/10'
                          }`}
                      >
                        Add Patient
                      </Link>
                    </li>
                  </ul>

                  <h3 className="text-white/70 text-xs font-bold uppercase">Functions</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to="/predict"
                        className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/predict')
                          ? 'bg-white text-purple-700 font-bold'
                          : 'text-white/90 hover:bg-white/20'
                          }`}
                      >
                        Risk Prediction
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/therapy-effectiveness"
                        className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/therapy-effectiveness')
                          ? 'bg-white text-purple-700 font-bold'
                          : 'text-white/90 hover:bg-white/20'
                          }`}
                      >
                        Therapy Effectiveness
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/treatment-recommendation"
                        className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/treatment-recommendation')
                          ? 'bg-white text-purple-700 font-bold'
                          : 'text-white/90 hover:bg-white/20'
                          }`}
                      >
                        Treatment Recommendation
                      </Link>
                    </li>
                  </ul>
                </>
              )}

              {/* Patient Sidebar */}
              {user.role === 'patient' && (
                <>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to="/profile"
                        className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/profile')
                          ? 'bg-white text-purple-700 font-bold'
                          : 'text-white/90 hover:bg-white/10'
                          }`}
                      >
                        My Profile
                      </Link>
                    </li>

                    <li>
                      <Link
                        to="/chatbot"
                        className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/chatbot')
                          ? 'bg-white text-purple-700 font-bold'
                          : 'text-white/90 hover:bg-white/10'
                          }`}
                      >
                        Chat with Bot
                      </Link>
                    </li>

                  </ul>
                </>
              )}

              {/* Admin Sidebar */}
              {user.role === 'admin' && (
                <ul className="space-y-4 mt-4">
                  <li>
                    <Link
                      to="/admin/users"
                      className={`block px-3 py-2 rounded transition text-center ${isActive('/admin/users')
                        ? 'bg-white text-purple-700 font-bold'
                        : 'text-white/90 hover:bg-white/20'
                        }`}
                    >
                      Manage Users
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/patients"
                      className={`block px-3 py-2 rounded transition text-center ${isActive('/admin/patients')
                        ? 'bg-white text-purple-700 font-bold'
                        : 'text-white/90 hover:bg-white/20'
                        }`}
                    >
                      Manage Patients
                    </Link>
                  </li>
                </ul>
              )}
            </>
          )}
        </nav>

        <div className="mt-auto p-4 border-t border-white/20 w-full">
          {isOpen && (
            <button
              onClick={logout}
              className="block w-full text-center px-3 py-2 rounded transition text-white/90 hover:bg-white/10 appearance-none bg-transparent"
            >
              Log Out
            </button>
          )}
        </div>

      </aside>

      {/* Hover handle to peek when collapsed */}
      <div
        className="fixed left-0 top-0 h-full w-2 z-40"
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
      />

      {/* Edge collapse/expand control (outside sidebar) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
        className="fixed z-50 top-6 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow hover:bg-gray-100"
        style={{ left: (isOpen ? 246 : 10) }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>

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
