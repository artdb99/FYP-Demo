import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { patientsApi } from '../../api/patients';
import { fastApiClient } from '../../api/client';
import MetricBox from '../../components/MetricBox.jsx';

function RiskPredictionForm() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    async function fetchPatientAndPredict() {
      try {
        const data = await patientsApi.getById(id);
        setPatientData(data);

        const features = [
          parseFloat(data.hba1c_1st_visit),
          parseFloat(data.hba1c_2nd_visit),
          parseFloat(data.fvg_1),
          parseFloat(data.fvg_2),
          parseFloat(data.avg_fvg_1_2),
          parseFloat(data.reduction_a)
        ];

        if (features.some(val => isNaN(val))) {
          setError('Invalid or missing input data.');
          setLoading(false);
          return;
        }

        const predictionRes = await fastApiClient.post('/predict', { features });

        const numericRisk = parseFloat(predictionRes.data.prediction);
        const riskLabel = mapNumericRisk(numericRisk);
        const riskColor = getRiskColor(riskLabel);

        setResult({ value: numericRisk.toFixed(2), label: riskLabel, color: riskColor });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch or predict.');
        setLoading(false);
      }
    }

    fetchPatientAndPredict();
  }, [id]);

  const mapNumericRisk = (val) => {
    if (val < 5.7) return 'Normal';
    if (val < 6.5) return 'At Risk';
    if (val < 7.1) return 'Moderate Risk';
    if (val < 8.1) return 'Risky';
    if (val <= 9.0) return 'Very Risky';
    return 'Critical';
  };

  const getRiskColor = (label) => {
    switch (label) {
      case 'Normal': return 'bg-green-500';
      case 'At Risk': return 'bg-yellow-400';
      case 'Moderate Risk': return 'bg-yellow-500';
      case 'Risky': return 'bg-orange-500';
      case 'Very Risky': return 'bg-red-500';
      case 'Critical': return 'bg-red-800';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading patient and risk prediction...</div>;
  }

  const getKeyFactors = () => {
    const factors = [];

    if (patientData.hba1c_1st_visit > 8) {
      factors.push(`HbA1c at 1st visit is high (${patientData.hba1c_1st_visit}%)`);
    } else if (patientData.hba1c_1st_visit < 5.7) {
      factors.push(`HbA1c at 1st visit is in normal range (${patientData.hba1c_1st_visit}%)`);
    }

    if (patientData.fvg_1 > 130) {
      factors.push(`FVG at 1st visit is elevated (${patientData.fvg_1} mg/dL)`);
    }

    if (patientData.reduction_a_per_day < 0.01) {
      factors.push(`Daily HbA1c drop is low (${patientData.reduction_a_per_day?.toFixed(3)})`);
    }

    if (patientData.fvg_delta_1_2 > 0) {
      factors.push(`FVG increased between visits (+${patientData.fvg_delta_1_2})`);
    }

    return factors;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Diabetes Complication Risk Assessment
      </h2>
      <p className="text-center text-gray-600 mb-10">
        Automatically predicts patient complication risk based on HbA1c, FVG, and therapy indicators.
      </p>

      {/* Overview */}
      <div className="grid md:grid-cols-3 gap-6 bg-white rounded-xl shadow p-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold">{patientData.name}</h3>
          <p>{patientData.gender}, {patientData.age} y/o</p>
          <p><strong>Insulin Type:</strong> {patientData.insulin_regimen_type}</p>
          <p className="text-sm text-blue-100">
            <strong>Med History:</strong><br />{patientData.medicalHistory || '—'}<br />
            <strong>Medications:</strong><br />{patientData.medications || '—'}
          </p>
        </div>

        <div className="col-span-2 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Glycemic Metrics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <MetricBox label="HbA1c (1st)" value={patientData.hba1c_1st_visit} />
              <MetricBox label="HbA1c (2nd)" value={patientData.hba1c_2nd_visit} />
              <MetricBox label="FVG (1st)" value={patientData.fvg_1} />
              <MetricBox label="FVG (2nd)" value={patientData.fvg_2} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Treatment Trends</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <MetricBox label="HbA1c Δ" value={patientData.reduction_a?.toFixed(1)} />
              <MetricBox label="Daily HbA1c Drop" value={patientData.reduction_a_per_day?.toFixed(3)} />
              <MetricBox label="FVG Δ" value={patientData.fvg_delta_1_2} />
              <MetricBox label="Avg FVG" value={patientData.avg_fvg_1_2} />
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Predicted Complication Risk</h3>
        {result ? (
          <div className={`w-28 h-28 flex items-center justify-center text-white text-2xl font-bold rounded-full shadow-md ${result.color}`}>
            {result.value}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No result available</div>
        )}
        {result?.label && (
          <>
            <p className="text-sm font-medium text-gray-600">
              Category: <span className="font-semibold">{result.label}</span>
            </p>
            <div className="mt-4 text-left w-full max-w-2xl text-sm text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded shadow-sm">
              <h4 className="font-semibold mb-2">🔍 Key Factors:</h4>
              <ul className="list-disc ml-5 space-y-1">
                {getKeyFactors().map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        This assessment is powered by AI. Use clinical judgment alongside predictions for decision-making.
      </p>
    </div>
  );
}
export default RiskPredictionForm;
