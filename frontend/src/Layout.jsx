import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <button className="menu-button">☰</button>
        <h1></h1>
        <div className="profile-icon">👤</div>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <nav>
          <h3>Patients</h3>
          <ul>
            <li><Link to="/patients">List of Patients</Link></li>
            <li><Link to="/patients/create">Create Patient</Link></li>
            <li><Link to="/patients/add-from-app">Add Patient from App</Link></li>
          </ul>

          <h3>Risk Prediction</h3>
          <ul>
            <li><Link to="/predict">Predict HBA1C</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;