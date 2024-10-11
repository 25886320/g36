import React, { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempted with:', username, password);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password reset requested for:', forgotPasswordEmail);
    // TODO: Implement actual password reset logic
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
  };

  return (
    <div className="landing-page">
      <div className="login-card">
        {!showForgotPassword ? (
          <>
            <h2 className="login-title">Login</h2>
            <form onSubmit={handleLogin}>
              <div className="input-group relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div className="input-group relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Type your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <a href="#" className="forgot-password" onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(true);
              }}>Forgot password?</a>
              <button type="submit" className="login-button">LOGIN</button>
            </form>
            <div className="signup-option">
              <p>Don't have an account?</p>
              <Link to="/signup" className="signup-link">SIGN UP</Link>
            </div>
          </>
        ) : (
          <div className="forgot-password-form">
            <h2 className="login-title">Forgot Password</h2>
            <form onSubmit={handleForgotPassword}>
              <div className="input-group relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <button type="submit" className="login-button">Send Reset Email</button>
            </form>
            <button 
              onClick={() => setShowForgotPassword(false)} 
              className="back-to-login italic text-center mx-auto block my-4 px-4 py-2"
            >
              back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
