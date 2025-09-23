import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/UserContext";

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

  const { login } = useUser();
  const navigate = useNavigate();

  const handleRoleSelection = (selectedRole) => setRole(selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

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
    <form onSubmit={handleSubmit} className="min-h-screen w-full p-8 bg-white flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Healthcare Portal Registration</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <RoleButton role="admin" current={role} onClick={handleRoleSelection} color="blue" />
        <RoleButton role="doctor" current={role} onClick={handleRoleSelection} color="green" />
        <RoleButton role="patient" current={role} onClick={handleRoleSelection} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name" value={firstName} onChange={setFirstName} required />
        <Input label="Last Name" value={lastName} onChange={setLastName} required />
        <div>
          <label className="block text-gray-600">Gender</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <Input label="Email" type="email" value={email} onChange={setEmail} required />
        <Input label="Phone" value={phone} onChange={setPhone} required />
        <Input label="Date of Birth" type="date" value={dob} onChange={setDob} required />
        <Input label="Password" type="password" value={password} onChange={setPassword} required />
        <Input label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} required />
      </div>

      <button type="submit" className="w-full p-3 bg-blue-600 text-white rounded-lg mt-6">Register</button>
    </form>
  );
};

const Input = ({ label, value, onChange, type = "text", required = false }) => (
  <div>
    <label className="block text-gray-600">{label}</label>
    <input
      type={type}
      className="w-full p-3 border border-gray-300 rounded-lg"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  </div>
);

const RoleButton = ({ role, current, onClick, color }) => (
  <button
    type="button"
    onClick={() => onClick(role)}
    className={`p-4 text-center border rounded-lg ${current === role ? `bg-${color}-200` : "hover:bg-gray-200"}`}
  >
    <div className={`text-${color}-600 capitalize`}>{role}</div>
    <div className="text-sm">
      {role === "admin"
        ? "Manage the healthcare system"
        : role === "doctor"
          ? "Provide medical care"
          : "Access your health records"}
    </div>
  </button>
);

export default RegistrationForm;
