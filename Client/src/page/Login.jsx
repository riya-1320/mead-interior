import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utilities/api'; // Import your Axios API instance
import './Login.css'; // Import the CSS for the login page
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Switch between User and Admin tabs
  const handleTabClick = (role) => {
    setActiveTab(role);
    setError(''); // Clear any previous errors when switching tabs
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', { email, password, role: activeTab });
      const { token, user } = res.data;

      // Save token to local storage
      localStorage.setItem('token', token);

      // Role-based navigation and validation
      if (activeTab === 'admin' && user.role !== 'Admin') {
        setError('You do not have admin privileges. Please login as a user.');
      } else if (activeTab === 'admin') {
        navigate('/Dashboard'); // Admin dashboard path
      } else {
        navigate('/homepage'); // User dashboard path
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className='loginContainer'>
      <div className="login-container">
        <div className="login-card">
          {/* <h2 className="login-title">Welcome Back!</h2> */}
          <div className="logo-container">
          <img src={logo} alt="logo" className="logo" />
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'user' ? 'active' : ''}`}
              onClick={() => handleTabClick('user')}
            >
              User Login
            </button>
            <button
              className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleTabClick('admin')}
            >
              Admin Login
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className='loginlabel' htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label className='loginlabel' htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className='login-button-div'><button type="submit" className="login-button">
              Login
            </button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
