import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/UserContext.jsx";

const RegistrationForm = () => {
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const minLen = 6;

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isCapitalizedName = (val) => /^[A-Z][a-zA-Z'-]*$/.test(val);

  const { login } = useUser();
  const navigate = useNavigate();

  const handleRoleSelection = (selectedRole) => setRole(selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitted(true);

    const invalid = (
      !firstName || !isCapitalizedName(firstName) ||
      !lastName || !isCapitalizedName(lastName) ||
      !gender ||
      !email || !isValidEmail(email) ||
      !phone ||
      !dob ||
      !password || password.length < minLen ||
      !confirmPassword || confirmPassword !== password
    );
    if (invalid) return;

    const userData = {
      name: `${firstName} ${lastName}`,
      email,
      phone,
      dob,
      gender,
      password,
      password_confirmation: confirmPassword,
      role,
    };

    try {
      const laravelUrl = import.meta.env.VITE_LARAVEL_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${laravelUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Complete!");
        login({
          role: role,
          name: `${firstName} ${lastName}`,
          id: data.user?.id || null,
        });
        navigate('/');
      } else {
        alert("Registration failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while registering.");
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-teal-600 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 p-8 md:p-10 rounded-xl shadow-lg mx-4">
        <h2 className="text-3xl font-bold text-center text-purple-700 dark:text-purple-400 mb-1">Create your account</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">Join the healthcare portal to manage and view health insights</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RoleButton role="admin" current={role} onClick={handleRoleSelection} color="purple" />
            <RoleButton role="doctor" current={role} onClick={handleRoleSelection} color="green" />
            <RoleButton role="patient" current={role} onClick={handleRoleSelection} color="blue" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="First Name" name="firstName" value={firstName} onChange={setFirstName} required />
              {(submitted && !firstName) ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (submitted && firstName && !isCapitalizedName(firstName)) ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">First letter must be uppercase. Only letters, hyphens, or apostrophes.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>
            <div>
              <Input label="Last Name" name="lastName" value={lastName} onChange={setLastName} required />
              {(submitted && !lastName) ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (submitted && lastName && !isCapitalizedName(lastName)) ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">First letter must be uppercase. Only letters, hyphens, or apostrophes.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender <span className="text-rose-600">*</span></label>
              <select
                className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {submitted && !gender ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>

            <div>
              <Input label="Email" name="email" type="email" value={email} onChange={setEmail} required />
              {(submitted && !email) ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (submitted && email && !isValidEmail(email)) ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">Enter a valid email address.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>
            <div>
              <Input label="Phone" name="phone" value={phone} onChange={setPhone} required />
              {submitted && !phone ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>
            <div>
              <Input label="Date of Birth" name="dob" type="date" value={dob} onChange={setDob} required />
              {submitted && !dob ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-rose-600">*</span></label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {submitted && password && password.length < minLen ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">Password must be at least {minLen} characters.</p>
              ) : submitted && !password ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password <span className="text-rose-600">*</span></label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {submitted && confirmPassword && confirmPassword !== password ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">Passwords do not match.</p>
              ) : submitted && !confirmPassword ? (
                <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
              ) : (
                <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white py-2 rounded-md font-semibold hover:opacity-90 shadow transition"
          >
            Create account
          </button>

          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            Already have an account? <a href="/" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, name, value, onChange, onBlur, type = "text", required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label} {required && (<span className="text-rose-600">*</span>)}</label>
    <input
      type={type}
      className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      required={required}
    />
  </div>
);

const RoleButton = ({ role, current, onClick, color }) => {
  const colorStyles = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };
  const selected = current === role;
  const styles = colorStyles[color] || colorStyles.blue;
  return (
    <button
      type="button"
      onClick={() => onClick(role)}
      className={`p-4 text-center border rounded-lg transition ${selected ? styles.bg : 'hover:bg-gray-100'}`}
    >
      <div className={`${styles.text} capitalize font-medium`}>{role}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {role === "admin"
          ? "Manage the healthcare system"
          : role === "doctor"
            ? "Provide medical care"
            : "Access your health records"}
      </div>
    </button>
  );
};

export default RegistrationForm;
