import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../services/api';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
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
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await api.post('/auth/register', registrationData);
      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth state
      onLogin(user);
      
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-card">
        <div className="auth-left">
          <h2>Create Your Account</h2>
          <p>Join Trakvest to track portfolios, set goals and manage funds.</p>
          <div className="auth-cta">
            <p>Already have an account?</p>
            <Link to="/login" style={{ color: 'black' }}>Sign in</Link>
          </div>
        </div>
        <div className="auth-right">
          <h3>Register</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Full name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@domain.com" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Choose a password" minLength="6" />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm password" minLength="6" />
            </div>
            <button type="submit" disabled={isLoading}>{isLoading ? 'Creating Account...' : 'Register'}</button>
          </form>
          <p className="auth-link">Already have an account? <Link to="/login" >Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

Register.propTypes = {
  onLogin: PropTypes.func.isRequired
};

export default Register;