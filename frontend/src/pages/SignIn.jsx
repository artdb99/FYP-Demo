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

    const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://127.0.0.1:8000";
    try {
      const response = await fetch(`${laravelUrl}/api/login`, {
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

        if (role === 'doctor') navigate('/patients');
        else if (role === 'patient') navigate('/profile');
        else navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Failed to sign in. The API might not be implemented yet.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-teal-600 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg mx-4">
        <h2 className="text-3xl font-bold text-center text-purple-700 dark:text-purple-400 mb-1">Welcome Back</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <input
              type="email"
              id="email"
              className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="form-checkbox text-purple-600 dark:bg-gray-800 dark:border-gray-600"
              />
              <span className="ml-2">Remember me</span>
            </label>
            <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white py-2 rounded-md font-semibold hover:opacity-90 shadow transition"
          >
            Sign in
          </button>

          <p className="text-center text-sm mt-6 text-gray-700 dark:text-gray-300">
            Don’t have an account?{' '}
            <a href="/register" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
