import React, { useEffect, useState } from 'react';
import { useUser } from '../UserContext';
import { useNavigate } from 'react-router-dom';

const UpdatePatient = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [patientId, setPatientId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    insulinType: '',
    medicalHistory: '',
    medications: '',
    remarks: '',
    fvg: '',
    fvg_1: '',
    fvg_2: '',
    fvg_3: '',
    hba1c1: '',
    hba1c2: '',
    hba1c3: '',
    egfr: '',
    dds_1: '',
    dds_3: '',
    first_visit_date: '',
    second_visit_date: '',
    third_visit_date: ''
  });

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:8000/api/patients/by-user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setPatientId(data.id);
        setFormData({
          name: data.name || '',
          age: data.age || '',
          gender: data.gender || '',
          insulinType: data.insulin_regimen_type || '',
          medicalHistory: data.medical_history || '',
          medications: data.medications || '',
          remarks: data.remarks || '',
          fvg: data.fvg || '',
          fvg_1: data.fvg_1 || '',
          fvg_2: data.fvg_2 || '',
          fvg_3: data.fvg_3 || '',
          hba1c1: data.hba1c_1st_visit || '',
          hba1c2: data.hba1c_2nd_visit || '',
          hba1c3: data.hba1c_3rd_visit || '',
          egfr: data.egfr || '',
          dds_1: data.dds_1 || '',
          dds_3: data.dds_3 || '',
          first_visit_date: data.first_visit_date || '',
          second_visit_date: data.second_visit_date || '',
          third_visit_date: data.third_visit_date || ''
        });
      });
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const enrichedData = {
      ...formData,
      fvg: parseFloat(formData.fvg),
      fvg_1: parseFloat(formData.fvg_1),
      fvg_2: parseFloat(formData.fvg_2),
      fvg_3: parseFloat(formData.fvg_3),
      hba1c1: parseFloat(formData.hba1c1),
      hba1c2: parseFloat(formData.hba1c2),
      hba1c3: parseFloat(formData.hba1c3),
      egfr: parseFloat(formData.egfr),
      dds_1: parseFloat(formData.dds_1),
      dds_3: parseFloat(formData.dds_3)
    };

    try {
      const res = await fetch(`http://localhost:8000/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData)
      });

      if (!res.ok) throw new Error('Update failed');
      alert('Patient profile updated!');
      navigate(`/patient/${patientId}`);
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update patient.');
    }
  };

  if (!patientId) return <div className="p-6">Loading your record...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Update Your Patient Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} />
        <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
        <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
        <Select label="Insulin Regimen Type" name="insulinType" value={formData.insulinType} onChange={handleChange} options={["Basal", "Bolus", "Premixed", "Basal-Bolus", "None"]} />
        <Textarea label="Medical History" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} />
        <Textarea label="Medications" name="medications" value={formData.medications} onChange={handleChange} />
        <Textarea label="Remarks" name="remarks" value={formData.remarks} onChange={handleChange} />
        <Input label="FVG" name="fvg" value={formData.fvg} onChange={handleChange} />
        <Input label="FVG 1" name="fvg_1" value={formData.fvg_1} onChange={handleChange} />
        <Input label="FVG 2" name="fvg_2" value={formData.fvg_2} onChange={handleChange} />
        <Input label="FVG 3" name="fvg_3" value={formData.fvg_3} onChange={handleChange} />
        <Input label="HbA1c 1" name="hba1c1" value={formData.hba1c1} onChange={handleChange} />
        <Input label="HbA1c 2" name="hba1c2" value={formData.hba1c2} onChange={handleChange} />
        <Input label="HbA1c 3" name="hba1c3" value={formData.hba1c3} onChange={handleChange} />
        <Input label="eGFR" name="egfr" value={formData.egfr} onChange={handleChange} />
        <Input label="DDS 1" name="dds_1" value={formData.dds_1} onChange={handleChange} />
        <Input label="DDS 3" name="dds_3" value={formData.dds_3} onChange={handleChange} />
        <Input label="First Visit Date" type="date" name="first_visit_date" value={formData.first_visit_date} onChange={handleChange} />
        <Input label="Second Visit Date" type="date" name="second_visit_date" value={formData.second_visit_date} onChange={handleChange} />
        <Input label="Third Visit Date" type="date" name="third_visit_date" value={formData.third_visit_date} onChange={handleChange} />
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">Update Profile</button>
      </form>
    </div>
  );
};

// Reusable components
const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 rounded"
    />
  </div>
);

const Textarea = ({ label, name, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={3}
      className="w-full p-2 border border-gray-300 rounded"
    ></textarea>
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 rounded"
    >
      <option value="">Select {label}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default UpdatePatient;
