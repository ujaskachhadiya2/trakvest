import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import api from "../services/api";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem("token", token);
      // Save the returned user object (including isAdmin)
      localStorage.setItem("user", JSON.stringify(user));

      // Update auth state immediately so App sees the admin flag before navigation
      onLogin(user);

      // For admin users, show credentials but DO NOT auto-redirect to admin dashboard
      if (user.isAdmin) {
        // Show admin credentials in an alert
        alert("Welcome Admin");
        // intentionally do not navigate to /admin
        navigate("/");
      } else {
        // Regular users go to main dashboard
        navigate("/");
      }
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-card">
        <div className="auth-left">
          <h2>Welcome Back</h2>
          <p>Login to manage your portfolio, track stocks and reach your financial goals.</p>
          <div className="auth-cta">
            <p>New here?</p>
            <Link to="/register" style={{ color: "black" }}>Create account</Link>
          </div>
        </div>
        <div className="auth-right">
          <h3>Login</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@domain.com" />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Enter your password" />
            </div>
            
            <button type="submit" disabled={isLoading}>{isLoading ? "Logging in..." : "Login"}</button>
          </form>
          <p className="auth-link">Don"t have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  onLogin: PropTypes.func.isRequired
};

export default Login;