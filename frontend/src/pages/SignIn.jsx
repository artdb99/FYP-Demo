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

      if (role === 'doctor') navigate('/patients');
      else if (role === 'patient') navigate('/profile');
      else navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg mx-4">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-1">Welcome Back</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              id="email"
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="form-checkbox text-purple-600"
              />
              <span className="ml-2">Remember me</span>
            </label>
            <a href="#" className="text-purple-600 hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white py-2 rounded-md font-semibold hover:opacity-90 shadow transition"
          >
            Sign in
          </button>

          <div className="flex items-center justify-center mt-6 text-sm text-gray-600">
            <span>Or continue with</span>
          </div>

          <div className="flex justify-center gap-3 mt-3">
            <button type="button" className="flex items-center gap-2 bg-white border border-gray-300 text-purple-600 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/0e/Google_2015_logo.svg" alt="Google" className="w-5 h-5" />
              Google
            </button>
            <button type="button" className="flex items-center gap-2 bg-white border border-gray-300 text-purple-600 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Facebook_icon.png" alt="Facebook" className="w-5 h-5" />
              Facebook
            </button>
          </div>

          <p className="text-center text-sm mt-6 text-gray-700">
            Don’t have an account?{' '}
            <a href="/register" className="text-purple-600 hover:underline font-medium">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
