// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router";
import axios from "../lib/axios";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth(); // use login() from context
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/user/login", { staffId, password });

      // save user via AuthContext (handles localStorage + state)
      login(res.data);

      // navigate after context is updated
      if (res.data.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/staff/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      alert("Invalid login. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded-lg p-8 w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <input
          type="text"
          placeholder="User ID"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
