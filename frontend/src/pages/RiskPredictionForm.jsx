import { useState } from 'react';
import axios from 'axios';

function RiskPredictionForm() {
  const [formData, setFormData] = useState({
    AGE: '',
    GENDER: '',
    DURATION_DM: '',
    Freq_SMBG: '',
    Freq_Hypo: '',
    Freq_of_Visits: '',
    eGFR: '',
    CKD_Stage: ''
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/predict', formData);
      setResult(response.data.prediction);
    } catch (err) {
      setError('Prediction failed. Please check the input or server.');
    }
  };

  return (
    <div className="risk-page">
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Risk Prediction Form</h2>
      <div style={{ width: '100%' }}>
      <form className="risk-form" onSubmit={handleSubmit}>
        <InputField label="AGE" name="AGE" value={formData.AGE} handleChange={handleChange} />
        <InputField label="GENDER" name="GENDER" value={formData.GENDER} handleChange={handleChange} />
        <InputField label="DURATION DM" name="DURATION_DM" value={formData.DURATION_DM} handleChange={handleChange} />
        <InputField label="Freq SMBG" name="Freq_SMBG" value={formData.Freq_SMBG} handleChange={handleChange} />
        <InputField label="Freq Hypo" name="Freq_Hypo" value={formData.Freq_Hypo} handleChange={handleChange} />
        <InputField label="Freq of Visits" name="Freq_of_Visits" value={formData.Freq_of_Visits} handleChange={handleChange} />
        <InputField label="eGFR" name="eGFR" value={formData.eGFR} handleChange={handleChange} />
        <InputField label="CKD Stage" name="CKD_Stage" value={formData.CKD_Stage} handleChange={handleChange} />

        <button type="submit" className="predict-button" style={{ marginTop: '1rem' }}>
          Predict
        </button>
      </form>
      </div>
      
      {result && (
        <div style={{ marginTop: '2rem', color: 'green', fontWeight: 'bold', textAlign: 'center' }}>
          Predicted HbA1C: {result}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '2rem', color: 'red', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
}

function InputField({ label, name, value, handleChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={handleChange}
        required
      />
    </div>
  );
}

export default RiskPredictionForm;