import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from './UserContext'; // 1. import context

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useUser(); // 2. get role from context


  const isActive = (path) => location.pathname === path;

  if (!user) return <div className="p-6">Please sign in.</div>; // fallback

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col h-full overflow-y-auto transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
          } bg-gradient-to-b from-teal-500 to-green-600 text-white shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/20">
          {!collapsed && (
            <div className="flex-1 flex justify-center">
              <h2 className="text-lg font-bold">
                {user.role === 'doctor' ? "Doctor's Dashboard" : user.role === 'patient' ? "Patient Portal" : "Admin Panel"}
              </h2>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-purple-700 bg-white border border-white/40 rounded p-1 shadow hover:bg-purple-100 transition"
          >
            ☰
          </button>

        </div>

        <nav className="flex flex-col items-center space-y-4 pt-4">
          {/* Doctor Sidebar */}
          {user.role === 'doctor' && (
            <>
              {!collapsed && <h3 className="text-white/70 text-xs font-bold uppercase">Patients</h3>}
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/patients"
                    className={`block px-3 py-2 rounded transition ${isActive('/patients')
                      ? 'bg-white text-purple-700 font-bold'
                      : 'text-white/90 hover:bg-white/10'
                      }`}
                  >
                    {collapsed ? '📋' : 'List of Patients'}
                  </Link>
                </li>
              </ul>

              {!collapsed && (
                <h3 className="text-white/70 text-xs font-bold uppercase">Functions</h3>
              )}
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/predict"
                    className={`block w-full text-center px-3 py-2 rounded transition ${isActive('/predict')
                      ? 'bg-white text-purple-700 font-bold'
                      : 'text-white/90 hover:bg-white/20'
                      }`}
                  >
                    {collapsed ? '🧠' : 'Risk Prediction'}
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
                    {collapsed ? '💊' : 'Therapy Effectiveness'}
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
                    {collapsed ? '📑' : 'Treatment Recommendation'}
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
                    className={`block px-3 py-2 rounded transition ${isActive('/profile')
                      ? 'bg-white text-purple-700 font-bold'
                      : 'text-white/90 hover:bg-white/10'
                      }`}
                  >
                    {collapsed ? '👤' : 'My Profile'}
                  </Link>

                </li>

                <li>
                  <Link
                    to="/chatbot"
                    className={`block px-3 py-2 rounded transition ${isActive('/chatbot')
                      ? 'bg-white text-purple-700 font-bold'
                      : 'text-white/90 hover:bg-white/10'
                      }`}
                  >
                    {collapsed ? '🤖' : 'Chat with Bot'}
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
                  {collapsed ? '👥' : 'Manage Users'}
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
                  {collapsed ? '➕' : 'Manage Patients'}
                </Link>
              </li>
            </ul>
          )}
        </nav>

        <div className="mt-auto p-4 border-t border-white/20 w-full">
          <button
            onClick={logout}
            className="block w-full text-center px-3 py-2 rounded transition text-white/90 hover:bg-white/10 appearance-none bg-transparent"
          >
            {collapsed ? '🚪' : 'Log Out'}
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full overflow-auto bg-gray-50">
        <main className="flex-1 w-full px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
