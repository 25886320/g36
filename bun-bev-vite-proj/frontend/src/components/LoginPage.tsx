import React, { useState } from 'react';
import { FaLock, FaEnvelope } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';
import api from '../services/api';

interface LoginPageProps {
  login: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps & { showToast: (severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined, summary: string, detail: string) => void }> = ({ login, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call API to log in the user
      const response = await api.login({ email, password });
      console.log('Login successful!');
      //alert('Login successful!');

      // Store the JWT token in localStorage
      const { token } = response.data;
      login(token);

      // Redirect to home page
      navigate('/home');
    } catch (error: unknown) {
      console.error('Error logging in: ', error);
      // alert('Login failed. Please check your credentials.');
      // showToast('error', 'Login Failed', 'Please check your credentials.');
      const err = error as { response?: { status: number, data: { message: string } } };
      if (err.response && err.response.status === 400) {
        showToast('error', 'Login Failed', err.response.data.message);
      } else {
        showToast('error', 'Login Failed', 'Please check your credentials.');
      }
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password reset requested for:', forgotPasswordEmail);
    // TODO: Implement actual password reset logic
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    navigate('/home');
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-card">
        {!showForgotPassword ? (
          <>
            <h2 className="auth-title">Login</h2>
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Type your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Type your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="forgot-password-container">
                <button
                  type="button"
                  className="link-button forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="auth-button">
                LOGIN
              </button>
            </form>
            <div className="option-section">
              <p>Don't have an account?</p>
              <Link to="/signup" className="option-link">
                SIGN UP
              </Link>
            </div>
          </>
        ) : (
          <div className="forgot-password-form">
            <h2 className="auth-title">Forgot Password</h2>
            <form onSubmit={handleForgotPassword}>
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <button type="submit" className="auth-button">
                Send Reset Email
              </button>
            </form>
            <button
              onClick={() => setShowForgotPassword(false)}
              className="link-button back-to-login"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
