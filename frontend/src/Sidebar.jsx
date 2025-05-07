function Sidebar() {
    return (
      <div style={{
        width: '250px',
        background: '#fff',
        color: '#111',
        height: '100vh',
        padding: '1.5rem',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard</h2>
  
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '.5rem' }}>Patients</h3>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '1rem' }}>
            <li>List of Patients</li>
            <li>Create Patient</li>
            <li>Add Patient from App</li>
          </ul>
        </div>
  
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '.5rem' }}>Risk Prediction</h3>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '1rem' }}>
            <li>Predict HbA1C</li>
          </ul>
        </div>
      </div>
    );
  }
  
  export default Sidebar;  