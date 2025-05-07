import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Divider, Typography, Grid } from '@mui/material';

const Medications = ({ patient }) => {
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    // Assuming medication data is available in the patient's data
    if (patient && patient.medications) {
      setMedications(patient.medications.split(', ')); // Splitting medications if they're stored as a comma-separated string
    }
  }, [patient]);

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Medications
      </Typography>
      <Grid container spacing={2}>
        {medications.length === 0 ? (
          <Typography variant="h6" color="textSecondary">
            No medications available.
          </Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {medications.map((medication, index) => (
              <div key={index}>
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #ddd',
                  }}
                >
                  <ListItemText
                    primary={medication}
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

export default Medications;
