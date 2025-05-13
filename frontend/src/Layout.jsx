import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 h-full overflow-y-auto bg-white shadow-lg transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {!collapsed && <h2 className="text-lg font-bold">Dashboard</h2>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-xl">
            ☰
          </button>
        </div>

        <nav className="px-4 space-y-6 text-sm">
          {!collapsed && <h3 className="text-gray-600 font-semibold">Patients</h3>}
          <ul className="space-y-2">
            <li>
              <Link
                to="/patients"
                className={`block px-3 py-2 rounded transition ${
                  isActive('/patients')
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {collapsed ? '📋' : 'List of Patients'}
              </Link>
            </li>
            <li>
              <Link
                to="/patients/create"
                className={`block px-3 py-2 rounded transition ${
                  isActive('/patients/create')
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {collapsed ? '➕' : 'Create Patient'}
              </Link>
            </li>
          </ul>

          {!collapsed && <h3 className="text-gray-600 font-semibold mt-6">Functions</h3>}
          <ul className="space-y-2">
            <li>
              <Link
                to="/predict"
                className={`block px-3 py-2 rounded transition ${
                  isActive('/predict')
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {collapsed ? '🧠' : 'Predict HBA1C'}
              </Link>
            </li>
            <li>
              <Link
                to="/therapy-effectiveness"
                className={`block px-3 py-2 rounded transition ${
                  isActive('/therapy-effectiveness')
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {collapsed ? '💊' : 'Therapy Effectiveness'}
              </Link>
            </li>
            <li>
              <Link
                to="/treatment-recommendation"
                className={`block px-3 py-2 rounded transition ${
                  isActive('/treatment-recommendation')
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {collapsed ? '📑' : 'Treatment Recommendation'}
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full overflow-auto">

        <main className="flex-1 w-full px-6 py-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
