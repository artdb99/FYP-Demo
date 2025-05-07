import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { List, ListItem, ListItemText, Divider, Typography, Grid } from '@mui/material';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    // Fetch patient data from your backend API
    fetch('http://localhost/ai-ncd-project/patients.php') // Updated path
      .then((response) => response.json())
      .then((data) => setPatients(data))
      .catch((error) => console.error('Error fetching patients:', error));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        List of Patients
      </Typography>
      <Grid container spacing={2}>
        {patients.length === 0 ? (
          <Typography variant="h6" color="textSecondary">
            No patients available.
          </Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {patients.map((patient) => (
              <div key={patient.id}>
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #ddd',
                  }}
                >
                  <ListItemText
                    primary={
                      <Link to={`/patient/${patient.id}`} style={{ textDecoration: 'none', color: '#1976d2' }}>
                        {patient.name}
                      </Link>
                    }
                  />
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        )}
      </Grid>
    </div>
  );
};

export default PatientsList;