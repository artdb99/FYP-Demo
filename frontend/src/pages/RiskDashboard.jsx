import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const RiskDashboard = () => {
    const [patients, setPatients] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [riskResults, setRiskResults] = useState({}); // { id: { value, label } }
    const riskCounts = Object.values(riskResults).reduce((acc, r) => {
        acc[r.label] = (acc[r.label] || 0) + 1;
        return acc;
    }, {});

    const riskCategories = ['Normal', 'At Risk', 'Moderate Risk', 'Risky', 'Very Risky', 'Critical'];
    const counts = riskCategories.map(cat => riskCounts[cat] || 0);

    // Bar chart data
    const chartData = {
        labels: riskCategories,
        datasets: [
            {
                label: 'Number of Patients',
                data: counts,
                backgroundColor: [
                    '#22c55e', // Normal (green)
                    '#facc15', // At Risk (yellow)
                    '#fbbf24', // Moderate Risk (amber)
                    '#fb923c', // Risky (orange)
                    '#ef4444', // Very Risky (red)
                    '#7f1d1d', // Critical (dark red)
                ],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Patients',
                    font: { weight: 'bold' },
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Risk Category',
                    font: { weight: 'bold' },
                },
            },
        },
    };

    useEffect(() => {
        const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://localhost:8000";
        fetch(`${laravelUrl}/api/patients`)
            .then(res => res.json())
            .then(data => {
                setPatients(data);
                setFiltered(data);
                runPredictions(data); // Trigger prediction API
            });
    }, []);

    const runPredictions = async (data) => {
        const results = {};
        for (const patient of data) {
            const features = [
                parseFloat(patient.hba1c_1st_visit),
                parseFloat(patient.hba1c_2nd_visit),
                parseFloat(patient.fvg_1),
                parseFloat(patient.fvg_2),
                parseFloat(patient.avg_fvg_1_2),
                parseFloat(patient.reduction_a)
            ];



            // ✅ Log the values you're sending to the model
            console.log(`🧪 Predicting for ${patient.name}`, features);

            if (features.some(val => isNaN(val))) {
                continue; // Skip invalid patients
            }

            try {
                const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:5000";
                const res = await axios.post(`${fastApiUrl}/predict`, { features });
                const rawValue = parseFloat(res.data.prediction); // keep full precision for mapping
                const value = rawValue.toFixed(2);                 // only format for display
                const label = mapNumericRisk(rawValue);            // use unrounded for mapping
                results[patient.id] = { value, label };
            } catch (error) {
                console.error(`Prediction failed for ${patient.name}`);
            }
        }
        setRiskResults(results);
    };

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(patients.filter(p => p.name.toLowerCase().includes(q)));
    }, [search, patients]);

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
            case 'Normal': return 'bg-green-100 text-green-700';
            case 'At Risk': return 'bg-yellow-100 text-yellow-700';
            case 'Moderate Risk': return 'bg-yellow-200 text-yellow-800';
            case 'Risky': return 'bg-orange-200 text-orange-800';
            case 'Very Risky': return 'bg-red-200 text-red-700';
            case 'Critical': return 'bg-red-800 text-white';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
            <div className="bg-teal-500 text-white rounded-lg p-6 mb-8 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold">Risk Prediction</h2>
                    <p className="text-sm text-blue-100">Model-driven prediction of diabetes severity</p>
                </div>
                <input
                    type="text"
                    placeholder="Search patients..."
                    className="px-4 py-2 border border-gray-300 rounded shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Risk Distribution Bar Chart */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Risk Distribution</h3>
                <Bar data={chartData} options={chartOptions} />
            </div>


            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p) => {
                    const risk = riskResults[p.id];
                    const badgeClass = getRiskColor(risk?.label);

                    return (
                        <div key={p.id} className="bg-white border rounded-xl shadow p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
                                    <p className="text-sm text-gray-600">{p.age} y/o — {p.gender}</p>
                                </div>
                                {risk ? (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
                                        {risk.label}
                                    </span>
                                ) : (
                                    <span className="text-xs font-medium text-gray-400">Loading...</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
                                <div>
                                    <p className="text-gray-500 font-medium">HbA1c (1st)</p>
                                    <p>{p.hba1c_1st_visit ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium">HbA1c (2nd)</p>
                                    <p>{p.hba1c_2nd_visit ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium">FVG (1st)</p>
                                    <p>{p.fvg_1 ?? '—'} mg/dL</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium">FVG (2nd)</p>
                                    <p>{p.fvg_2 ?? '—'} mg/dL</p>
                                </div>
                            </div>

                            <Link
                                to={`/predict/${p.id}`}
                                className="mt-4 block text-center bg-indigo-600 text-white font-semibold py-2 rounded hover:bg-indigo-700 transition"
                            >
                                View Details →
                            </Link>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <p className="text-center text-gray-400">No matching patients found.</p>
            )}
        </div>
    );
};

export default RiskDashboard;
