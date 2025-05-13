import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function RiskPredictionForm() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await axios.get(`http://localhost:8000/api/patients/${id}`);
        setPatientData(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load patient data');
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id]);

  const handleSubmit = async () => {
    setResult(null);
    setError(null);

    if (!patientData) return;

    const payload = {
      HbA1c1: parseFloat(patientData.hba1c_1st_visit),
      HbA1c2: parseFloat(patientData.hba1c_2nd_visit),
      FVG1: parseFloat(patientData.fvg_1),
      FVG2: parseFloat(patientData.fvg_2),
      Avg_FVG_1_2: parseFloat(patientData.avg_fvg_1_2),
      ReductionA: parseFloat(patientData.reduction_a),
      ReductionA_per_day: parseFloat(patientData.reduction_a_per_day),
      FVG_Delta_1_2: parseFloat(patientData.fvg_delta_1_2)
    };

    if (Object.values(payload).some(val => isNaN(val))) {
      setError('One or more fields are invalid or missing.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8000/api/predict', payload);
      setResult(res.data.prediction);
    } catch (err) {
      setError('Prediction failed. Please check input or server.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading patient data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Diabetes Complication Risk Assessment
      </h2>
      <p className="text-center text-gray-600 mb-10">
        This tool analyzes patient metrics to predict the risk of diabetes-related complications based on treatment response patterns.
      </p>

      {/* Metrics Display */}
      <div className="grid md:grid-cols-3 gap-6 bg-white rounded-xl shadow p-6">
        {/* Left Patient Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-6 space-y-4 flex flex-col justify-center">
          <div className="text-lg font-semibold">{patientData.name}</div>
          <div>{patientData.gender}, {patientData.age || '—'} years</div>
          <div><span className="font-semibold">Insulin Type:</span> {patientData.insulin_regimen_type}</div>
          <div className="text-sm text-blue-100">
            <p><span className="font-semibold">Medical History:</span><br />{patientData.medicalHistory || 'N/A'}</p>
            <p className="mt-2"><span className="font-semibold">Medications:</span><br />{patientData.medications || '—'}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="col-span-2 space-y-6">
          <div>
            <h3 className="font-semibold text-sm text-gray-600 mb-2">Glycemic Control Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
              <MetricBox label="HbA1c (1st)" value={patientData.hba1c_1st_visit} />
              <MetricBox label="HbA1c (2nd)" value={patientData.hba1c_2nd_visit} sub={`↓ ${(patientData.reduction_a).toFixed(1)}`} />
              <MetricBox label="FVG (1st)" value={patientData.fvg_1} />
              <MetricBox label="FVG (2nd)" value={patientData.fvg_2} sub={`↓ ${(patientData.fvg_delta_1_2)}`} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-600 mb-2">Treatment Response Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
              <MetricBox label="HbA1c Reduction" value={patientData.reduction_a?.toFixed(1)} />
              <MetricBox label="Daily Reduction" value={patientData.reduction_a_per_day?.toFixed(3)} />
              <MetricBox label="FVG Change" value={patientData.fvg_delta_1_2} />
              <MetricBox label="Avg FVG" value={patientData.avg_fvg_1_2} />
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Button */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center space-y-4">
        <h3 className="font-semibold text-lg text-gray-700">Risk Assessment</h3>
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-6 rounded hover:from-blue-600 hover:to-indigo-700 transition"
        >
          📊 Calculate Complication Risk
        </button>
        {result && (
          <div className="text-xl font-bold text-green-600">Predicted Risk: {result}</div>
        )}
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        This risk assessment tool uses AI to analyze treatment response patterns and predict complication risk.
        Always use clinical judgment in conjunction with these recommendations.
      </p>
    </div>
  );
}

const MetricBox = ({ label, value, sub }) => (
  <div className="bg-gray-50 border rounded-lg p-4 shadow-sm">
    <div className="text-gray-800 font-semibold text-lg">{value ?? '—'}</div>
    <div className="text-xs text-gray-600">{label}</div>
    {sub && <div className="text-xs text-green-500 font-medium">{sub}</div>}
  </div>
);

export default RiskPredictionForm;
