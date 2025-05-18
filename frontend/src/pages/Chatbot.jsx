import { useState } from 'react';

function Chatbot() {
    const [messages, setMessages] = useState([{ text: "Hello! I'm your AI health assistant. How can I help you today?", user: false }]);
    const [input, setInput] = useState("");
    const [suggestedQuestions, setSuggestedQuestions] = useState([
        'What are common symptoms of depression?',
        'How effective is CBT for anxiety?',
        'What lifestyle changes help with stress?',
        'When should I see a doctor about my symptoms?'
    ]);

    const sendMessage = async () => {
        const userMessage = { text: input, user: true };
        setMessages([...messages, userMessage]);
        setInput("");

        try {
            const response = await fetch('http://127.0.0.1:8000/api/chatbot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input })
            });
            const data = await response.json();
            const botMessage = { text: data.response, user: false };
            setMessages([...messages, userMessage, botMessage]);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleSuggestedQuestionClick = (question) => {
        setInput(question);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">AI Health Assistant</h2>
            <p className="text-gray-600 mb-6">Get instant answers to your health questions from our AI-powered assistant. Remember, this doesn't replace professional medical advice.</p>

            <div className="flex">
                {/* Chat Messages Section */}
                <div className="flex-1">
                    <div className="flex flex-col space-y-4 mb-4 h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                        {messages.map((message, index) => (
                            <div key={index} className={`p-3 rounded-lg ${message.user ? 'bg-blue-500 text-white self-end' : 'bg-blue-100 text-gray-800 self-start'}`}>
                                <p>{message.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your health question here..."
                            rows="2"
                        />
                        {/* Adjusted button with test background color */}
                        <button onClick={sendMessage} className="absolute right-2 bottom-2 bg-blue-500 text-white p-2 rounded-lg">
                            <i className="fas fa-paper-plane text-white"></i>
                        </button>
                    </div>
                </div>

                {/* Suggested Questions Section */}
                <div className="w-1/4 ml-6 p-4 border border-gray-200 rounded-lg">
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

            {/* About the AI */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">About Our AI</h3>
                <p className="text-sm text-blue-700 mb-3">Our assistant is trained on medical literature and guidelines, but cannot diagnose or replace professional care.</p>
                <div className="flex items-center text-sm">
                    <i className="fas fa-shield-alt text-blue-600 mr-2"></i>
                    <span className="text-blue-700">Your conversations are private and secure</span>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;