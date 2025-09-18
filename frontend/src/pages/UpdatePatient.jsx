import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const UpdatePatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
    fetch(`${laravelUrl}/api/patients/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          name: data.name || '',
          age: data.age || '',
          gender: data.gender || '',
          height_cm: data.height_cm || '',
          weight_kg: data.weight_kg || '',
          physical_activity: data.physical_activity || '',
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
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching patient:', err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      dds_3: parseFloat(formData.dds_3),
      height_cm: parseFloat(formData.height_cm),
      weight_kg: parseFloat(formData.weight_kg),
    };

    try {
      const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
      const res = await fetch(`${laravelUrl}/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData)
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      await res.json();
      alert('Patient updated!');
      navigate(`/patient/${id}`);
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update patient.');
    }
  };

  if (loading || !formData) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="bg-indigo-500 text-white rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold">Update Patient</h2>
        <p className="text-sm text-blue-100">Modify patient records and clinical details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Info */}
        <section className="bg-blue-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">🧍‍♂️ Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} />
            <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
            <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
            <Select label="Insulin Regimen Type" name="insulinType" value={formData.insulinType} onChange={handleChange} options={["BB", "PTDS", "PBD"]} />
            <Input label="Height (cm)" name="height_cm" type="number" step="0.1" value={formData.height_cm} onChange={handleChange} />
            <Input label="Weight (kg)" name="weight_kg" type="number" step="0.1" value={formData.weight_kg} onChange={handleChange} />
            <Select label="Physical Activity" name="physical_activity" value={formData.physical_activity} onChange={handleChange} options={['1–2 times per week','3–4 times per week','5–6 times per week','Daily']} />
          </div>
        </section>

        {/* Medical Background */}
        <section className="bg-green-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-green-700">📝 Medical Background</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Textarea label="Medical History" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} />
            <Textarea label="Current Medications" name="medications" value={formData.medications} onChange={handleChange} />
            <Textarea label="Additional Remarks" name="remarks" value={formData.remarks} onChange={handleChange} className="md:col-span-2" />
          </div>
        </section>

        {/* Clinical Indicators */}
        <section className="bg-purple-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">📊 Clinical Indicators</h2>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Fasting Venous Glucose (FVG)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Input name="fvg" label="Initial FVG" value={formData.fvg} onChange={handleChange} />
              <Input name="fvg_1" label="FVG (1st Visit)" value={formData.fvg_1} onChange={handleChange} />
              <Input name="fvg_2" label="FVG (2nd Visit)" value={formData.fvg_2} onChange={handleChange} />
              <Input name="fvg_3" label="FVG (3rd Visit)" value={formData.fvg_3} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">HbA1c Measurements</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Input name="hba1c1" label="HbA1c (1st Reading)" value={formData.hba1c1} onChange={handleChange} />
              <Input name="hba1c2" label="HbA1c (2nd Reading)" value={formData.hba1c2} onChange={handleChange} />
              <Input name="hba1c3" label="HbA1c (3rd Reading)" value={formData.hba1c3} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Other Clinical Indicators</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input name="egfr" label="eGFR" value={formData.egfr} onChange={handleChange} />
              <Input name="dds_1" label="DDS (1st Reading)" value={formData.dds_1} onChange={handleChange} />
              <Input name="dds_3" label="DDS (3rd Reading)" value={formData.dds_3} onChange={handleChange} />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Visit Dates</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Input name="first_visit_date" label="First Visit Date" type="date" value={formData.first_visit_date} onChange={handleChange} />
              <Input name="second_visit_date" label="Second Visit Date" type="date" value={formData.second_visit_date} onChange={handleChange} />
              <Input name="third_visit_date" label="Third Visit Date" type="date" value={formData.third_visit_date} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-5 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

// Reusable Input
const Input = ({ label, name, value, onChange, placeholder, type = "text", className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 placeholder-gray-500"
    />
  </div>
);

// Reusable Textarea
const Textarea = ({ label, name, value, onChange, placeholder, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows="3"
      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 placeholder-gray-500"
    />
  </div>
);

// Reusable Select
const Select = ({ label, name, value, onChange, options = [], className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default UpdatePatient;
