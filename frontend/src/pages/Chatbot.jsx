import { useState, useEffect } from 'react';
import { useUser } from '../UserContext';

function Chatbot() {
    const { user } = useUser();
    const [patient, setPatient] = useState(null);
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your AI health assistant. How can I help you today?", user: false }
    ]);
    const [input, setInput] = useState("");
    const [suggestedQuestions, setSuggestedQuestions] = useState([
        'How well is my diabetes being managed?',
        'What should I do about my recent HbA1c levels?',
        'What lifestyle changes should I consider?',
        'Should I be worried about my kidney function?'
    ]);

    // Load patient data based on logged-in user
    useEffect(() => {
        if (user?.id) {
            fetch(`http://localhost:8000/api/patients/by-user/${user.id}`)
                .then(res => res.json())
                .then(data => setPatient(data))
                .catch(err => console.error("Failed to load patient data:", err));
        }
    }, [user]);

    const sendMessage = async () => {
        const userMessage = { text: input, user: true };
        setMessages(prev => [...prev, userMessage]);
        setInput("");

        try {
            const res = await fetch('http://127.0.0.1:5000/chatbot-patient-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient,
                    query: input
                })
            });

            const data = await res.json();
            const botMessage = { text: data.response, user: false };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, { text: "⚠️ AI is currently unavailable.", user: false }]);
        }
    };

    const handleSuggestedQuestionClick = (question) => {
        setInput(question);
    };

    return (
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">AI Health Assistant</h2>
            <p className="text-gray-600 mb-6">
                Ask questions about your health — our AI considers your current lab data, medication, and risk trends.
            </p>

            <div className="flex gap-6">
                {/* Chat Messages Section */}
                <div className="w-3/4">
                    <div className="flex flex-col space-y-4 mb-4 h-[32rem] overflow-y-auto p-4 border border-gray-200 rounded-lg">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg max-w-[70%] whitespace-pre-wrap ${message.user ? 'bg-blue-500 text-white self-end' : 'bg-blue-100 text-gray-800 self-start'}`}
                            >
                                {message.user ? (
                                    <p>{message.text}</p>
                                ) : (
                                    message.text.split(/##\s+/).slice(1).map((section, secIndex) => {
                                        const [title, ...body] = section.split('\n');
                                        return (
                                            <div key={secIndex} className="mb-4">
                                                <p className="font-semibold text-blue-700">{title.trim()}</p>
                                                <p className="text-sm text-gray-800 whitespace-pre-line">{body.join('\n').trim()}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                        ))}
                    </div>

                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ask about your health here..."
                            rows="2"
                        />
                        <button onClick={sendMessage} className="absolute right-2 bottom-2 bg-blue-500 text-white p-2 rounded-lg">
                            <i className="fas fa-paper-plane text-white"></i>
                        </button>
                    </div>
                </div>

                {/* Suggested Questions Section */}
                <div className="w-1/4 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Suggested Questions</h3>
                    <div className="space-y-2">
                        {suggestedQuestions.map((question, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestedQuestionClick(question)}
                                className="w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition text-left"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">About Our AI</h3>
                <p className="text-sm text-blue-700 mb-3">
                    This assistant can explain your results, suggest questions for your doctor, and give tips on managing chronic conditions.
                </p>
                <div className="flex items-center text-sm">
                    <i className="fas fa-shield-alt text-blue-600 mr-2"></i>
                    <span className="text-blue-700">All responses are private and for informational use only</span>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;
