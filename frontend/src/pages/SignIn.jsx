import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext.jsx';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const { login } = useUser();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch('http://127.0.0.1:8000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            const { role, id, name } = data.user;
            login({ role, id, name });

            localStorage.setItem('isAuthenticated', 'true');

            if (role === 'doctor') {
                navigate('/patients');
            } else if (role === 'patient') {
                navigate('/profile'); // Will auto-redirect to /patient/:id
            } else {
                navigate('/');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 to-indigo-500">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-semibold text-center text-purple-600">Welcome back</h2>
                <p className="text-center text-gray-500">Sign in to your account</p>

                <form onSubmit={handleSubmit} className="mt-6">
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                                className="form-checkbox h-5 w-5 text-purple-600"
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">Remember me</label>
                        </div>
                        <a href="#" className="text-sm text-purple-600 hover:text-purple-800">Forgot password?</a>
                    </div>

                    <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-600">
                        Sign in
                    </button>

                    <div className="flex items-center justify-center mt-4">
                        <span className="text-sm text-gray-600">Or continue with</span>
                    </div>

                    <div className="flex justify-center mt-4">
                        <button type="button" className="bg-white border border-gray-300 text-purple-600 px-4 py-2 rounded-md shadow-sm mr-2 hover:bg-gray-100">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/0/0e/Google_2015_logo.svg" alt="Google" className="w-5 h-5 inline-block mr-2" />
                            Google
                        </button>
                        <button type="button" className="bg-white border border-gray-300 text-purple-600 px-4 py-2 rounded-md shadow-sm hover:bg-gray-100">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Facebook_icon.png" alt="Facebook" className="w-5 h-5 inline-block mr-2" />
                            Facebook
                        </button>
                    </div>

                    <div className="text-center text-sm mt-4">
                        <span>Don't have an account? <a href="/register" className="text-purple-600 hover:text-purple-800">Sign up</a></span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignIn;
