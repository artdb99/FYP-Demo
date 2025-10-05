import { useState, useEffect } from 'react';
import { useUser } from '@/UserContext.jsx';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
} from 'chart.js';
import Card from '@/components/Card.jsx';
import {
    Bot,
    Loader2,
    MessageCircle,
    Send,
    Sparkles,
    Stethoscope,
    Activity,
    Droplet,
    HeartPulse,
    Scale
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// Util: parse markdown-style bold + newlines
const parseMarkdownBold = (text) => {
    if (typeof text !== "string") return text;
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
};

const buildMetricSummary = (patient) => {
    if (!patient) return [];

    const metrics = [];

    const bmiValue = calculateBmi(patient);

    metrics.push({
        label: 'HbA1c (visit 3)',
        value: formatMetric(patient.hba1c_3rd_visit, 1, '%'),
        tone: 'emerald',
        icon: <Droplet size={16} />,
        detail: `Δ ${(patient.reduction_a ?? 0).toFixed(1)}% vs visit 1`
    });

    metrics.push({
        label: 'FVG (visit 3)',
        value: formatMetric(patient.fvg_3, 1, 'mmol/L'),
        tone: 'cyan',
        icon: <Activity size={16} />,
        detail: `Δ ${(patient.fvg_delta_1_2 ?? 0).toFixed(1)} since visit 1`
    });

    metrics.push({
        label: 'DDS (visit 3)',
        value: formatMetric(patient.dds_3, 1, ''),
        tone: 'purple',
        icon: <HeartPulse size={16} />,
        detail: `Trend ${(patient.dds_trend_1_3 ?? 0).toFixed(1)}`
    });

    metrics.push({
        label: 'BMI',
        value: bmiValue != null ? `${bmiValue.toFixed(1)}` : 'N/A',
        tone: 'sky',
        icon: <Scale size={16} />,
        detail: bmiValue != null ? describeBmi(bmiValue) : 'Height/weight missing'
    });

    return metrics;
};

const MetricBadge = ({ metric }) => {
    const toneStyles = {
        emerald: 'from-emerald-50 via-white to-emerald-50 border-emerald-100 text-emerald-600',
        cyan: 'from-cyan-50 via-white to-cyan-50 border-cyan-100 text-cyan-600',
        purple: 'from-purple-50 via-white to-purple-50 border-purple-100 text-purple-600',
        sky: 'from-sky-50 via-white to-sky-50 border-sky-100 text-sky-600',
    };

    return (
        <div className={`rounded-2xl border bg-gradient-to-br px-4 py-3 shadow-sm ${toneStyles[metric.tone]}`}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span className="text-base">{metric.icon}</span>
                <span>{metric.label}</span>
            </div>
            <p className="text-lg font-semibold text-slate-800 mt-2">{metric.value}</p>
            <p className="text-xs text-slate-500 mt-1">{metric.detail}</p>
        </div>
    );
};

const calculateBmi = (patient) => {
    if (!patient?.weight_kg || !patient?.height_cm) return null;
    const hMeters = Number(patient.height_cm) / 100;
    if (!hMeters) return null;
    return Number(patient.weight_kg) / (hMeters ** 2);
};

const describeBmi = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy range';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
};

const formatMetric = (value, decimals = 1, suffix = '') => {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    return `${Number(value).toFixed(decimals)}${suffix}`;
};

// Component: Reusable progress bar
const ProgressBar = ({ label, value, max }) => {
    const percent = Math.min(100, (value / max) * 100);
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>{label}</span>
                <span className="text-sm font-semibold text-slate-700">{Number(value ?? 0).toFixed(1)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 transition-all"
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
};

function Chatbot() {
    const { user } = useUser();
    const [patient, setPatient] = useState(null);
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your AI health assistant. How can I help you today?", user: false }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [patientContext, setPatientContext] = useState('');
    const [suggestedQuestions] = useState([
        'How well is my diabetes being managed?',
        'What should I do about my recent HbA1c levels?',
        'What lifestyle changes should I consider?',
        'Should I be worried about my kidney function?'
    ]);

    useEffect(() => {
        if (user?.id) {
            const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://127.0.0.1:8000";
            fetch(`${laravelUrl}/api/patients/by-user/${user.id}`)
                .then(res => res.json())
                .then(data => setPatient(data))
                .catch(err => console.error("Failed to load patient data:", err));
        }
    }, [user]);

    const sendMessage = async () => {
        const trimmedQuery = input.trim();
        if (!trimmedQuery) return;

        const trimmedContext = patientContext.trim();

        setMessages(prev => [
            ...prev,
            {
                text: trimmedQuery,
                user: true,
                context: trimmedContext || undefined,
            },
        ]);

        setInput("");
        setLoading(true);

        try {
            const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:5000";
            const payload = {
                patient,
                query: trimmedQuery,
            };

            if (trimmedContext) {
                payload.context = trimmedContext;
            }

            const res = await fetch(`${fastApiUrl}/chatbot-patient-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            const cleanedText = typeof data.response === 'string'
                ? data.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
                : data.response;

            setMessages(prev => [
                ...prev,
                {
                    text: cleanedText,
                    user: false,
                    contextSummary: trimmedContext || undefined,
                },
            ]);
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, { text: "⚠️ AI is currently unavailable.", user: false }]);
        } finally {
            setLoading(false);
            if (trimmedContext) {
                setPatientContext('');
            }
        }
    };

    const handleSuggestedQuestionClick = (question) => setInput(question);

    return (
        <div className="w-full px-6 md:px-10 lg:px-14 py-10 space-y-8 text-slate-900">
            <Card className="border-0 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-sky-50 ring-1 ring-purple-100/70 shadow-xl px-6 sm:px-8 py-8 space-y-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-500 shadow">
                            <Bot size={28} />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-[0.2em] text-purple-400">Conversational insight</p>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">AI Health Assistant</h1>
                            <p className="text-sm text-purple-500">
                                Ask follow-up questions about lab trends, lifestyle guidance, and therapy adjustments.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <HeroChip icon={<Stethoscope size={16} />} label="Linked patient" value={patient ? patient.name : 'Loading…'} />
                    </div>
                </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.4fr)]">
                <Card className="rounded-3xl bg-gradient-to-b from-white via-slate-50/80 to-white shadow-md ring-1 ring-slate-100/60 px-6 py-6 flex flex-col gap-4">
                    <div className="flex-1 overflow-hidden">
                        <div className="flex flex-col gap-4 h-[32rem] overflow-y-auto pr-1">
                            {messages.map((message, index) => (
                                <MessageBubble
                                    key={index}
                                    message={message}
                                    patient={patient}
                                    priorMessage={messages[index - 1]}
                                />
                            ))}

                            {loading && (
                                <div className="self-start flex items-center gap-1 text-purple-400 text-xs">
                                    <Loader2 size={14} className="animate-spin" />
                                    Thinking…
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-end gap-3">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 min-h-[3.5rem] resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 placeholder-slate-400"
                            placeholder="Ask about your health here..."
                            rows="3"
                        />
                        <button
                            onClick={sendMessage}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow hover:from-purple-600 hover:to-blue-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                            aria-label="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </Card>

                <Card className="rounded-3xl bg-gradient-to-br from-white via-purple-50/70 to-white shadow-md ring-1 ring-purple-100/60 px-5 py-6 space-y-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Quick prompts</p>
                        <h3 className="text-lg font-semibold text-slate-800 mt-1">Suggested questions</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        {suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestedQuestionClick(q)}
                                className="text-left rounded-xl border border-purple-100 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm hover:border-purple-200 hover:text-purple-500 transition"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Patient context</p>
                        <textarea
                            value={patientContext}
                            onChange={(e) => setPatientContext(e.target.value)}
                            className="w-full resize-none rounded-2xl border border-purple-100 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 placeholder-slate-400"
                            rows={4}
                            placeholder="Optional: share symptoms, goals, or lifestyle notes to tailor responses"
                        />
                        <p className="text-[11px] text-purple-300">
                            We’ll use this context to personalise your next AI response.
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="rounded-3xl bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-md ring-1 ring-blue-100/70 px-6 py-6 space-y-3">
                <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-blue-400" />
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">About our AI</h3>
                        <p className="text-sm text-blue-500">
                            Insights combine your latest visits with evidence-based coaching. Use it to prepare for clinician conversations.
                        </p>
                    </div>
                </div>
                <div className="text-xs text-blue-400">
                    Responses are private, for educational purposes, and do not replace medical advice.
                </div>
            </Card>
        </div>
    );
}

export default Chatbot;

const HeroChip = ({ icon, label, value }) => (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 text-xs text-slate-500 shadow-sm">
        <span className="text-purple-400">{icon}</span>
        <span className="font-semibold uppercase tracking-[0.2em] text-purple-300">{label}</span>
        <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
);

const MessageBubble = ({ message, patient, priorMessage }) => {
    const isUser = message.user;
    const wrapperClasses = isUser
        ? 'self-end bg-gradient-to-br from-purple-500 to-blue-500 text-white'
        : 'self-start bg-white text-slate-700 border border-purple-100';

    const insightTrigger = /(how.*doing|health.*status|overview|progress|report|trend|analysis|insight|summary|risk)/i;
    const shouldRenderInsightExtras =
        !isUser && patient && (insightTrigger.test(priorMessage?.text || '') || insightTrigger.test(message.text || ''));

    return (
        <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${wrapperClasses}`}>
            {!isUser ? (
                <div className="space-y-4">
                    {message.text.includes('##')
                        ? message.text.split(/##\s+/).slice(1).map((section, secIndex) => {
                              const [title, ...body] = section.split('\n');
                              return (
                                  <div key={secIndex} className="space-y-1">
                                      <p className="text-sm font-semibold text-purple-500">{title.trim()}</p>
                                      <div
                                          className="text-sm leading-relaxed"
                                          dangerouslySetInnerHTML={{
                                              __html: parseMarkdownBold(body.join('\n').trim())
                                          }}
                                      />
                                  </div>
                              );
                          })
                        : (
                              <div
                                  className="text-sm leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: parseMarkdownBold(message.text) }}
                              />
                          )}

                    {shouldRenderInsightExtras && (
                        <div className="space-y-4 rounded-2xl border border-purple-100 bg-white/80 px-4 py-4 text-slate-700">
                            <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Snapshot</p>
                            <div className="space-y-5">
                                {patient && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {buildMetricSummary(patient).map((metric) => (
                                            <MetricBadge key={metric.label} metric={metric} />
                                        ))}
                                    </div>
                                )}

                                <div className="h-40">
                                    <Line
                                        data={{
                                            labels: ['Visit 1', 'Visit 2', 'Visit 3'],
                                            datasets: [
                                                {
                                                    label: 'HbA1c (%)',
                                                    data: [patient.hba1c_1st_visit, patient.hba1c_2nd_visit, patient.hba1c_3rd_visit],
                                                    borderColor: '#6366f1',
                                                    backgroundColor: 'rgba(99,102,241,0.2)',
                                                    tension: 0.4,
                                                },
                                                {
                                                    label: 'FVG (mmol/L)',
                                                    data: [patient.fvg_1, patient.fvg_2, patient.fvg_3],
                                                    borderColor: '#10b981',
                                                    backgroundColor: 'rgba(16,185,129,0.2)',
                                                    tension: 0.4,
                                                },
                                                {
                                                    label: 'DDS',
                                                    data: [patient.dds_1, (patient.dds_1 + patient.dds_3) / 2, patient.dds_3],
                                                    borderColor: '#a855f7',
                                                    backgroundColor: 'rgba(216,180,254,0.2)',
                                                    tension: 0.4,
                                                    yAxisID: 'y1',
                                                },
                                            ],
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: { position: 'left', title: { display: true, text: 'HbA1c / FVG' } },
                                                y1: {
                                                    position: 'right',
                                                    grid: { drawOnChartArea: false },
                                                    title: { display: true, text: 'DDS' },
                                                },
                                            },
                                            plugins: { legend: { position: 'top' } },
                                        }}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <ProgressBar label="HbA1c (latest)" value={patient.hba1c_3rd_visit} max={12} />
                                    <ProgressBar label="FVG (latest)" value={patient.fvg_3} max={15} />
                                    <ProgressBar label="DDS (latest)" value={patient.dds_3} max={5} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm leading-relaxed">{message.text}</p>
            )}
        </div>
    );
};
