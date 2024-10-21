import React, { useState } from 'react';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';
import api from '../services/api';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';

interface LoginPageProps {
  login: (token: string, rememberMe: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps & { showToast: (severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined, summary: string, detail: string) => void }> = ({ login, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // Call API to log in the user
      const response = await api.login({ email, password, rememberMe });
      console.log('Login successful!');

      const { token } = response.data;
      login(token, rememberMe);

      // Redirect to home page
      navigate('/home');
    } catch (error: unknown) {
      console.error('Error logging in: ', error);

      const err = error as { response?: { status: number, data: { message: string } } };
      if (err.response && err.response.status === 400) {
        showToast('error', 'Login Failed', err.response.data.message);
      } else {
        showToast('error', 'Login Failed', 'Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      console.log('Checking if email exists:', forgotPasswordEmail);
      const emailExists = await api.checkEmailExists(forgotPasswordEmail);
      console.log('Email exists:', emailExists);
      
      if (!emailExists) {
        console.log('Email does not exist:', forgotPasswordEmail);
        showToast('error', 'Error', 'The provided email does not exist.');
        return;
      }

      const response = await api.resetPasswordRequest(forgotPasswordEmail);
      showToast('success', 'Success', response.data.message);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      showToast('error', 'Error', 'Failed to send password reset email.');
    } finally {
      setLoading(false);
      setForgotPasswordEmail('');
    }
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Type your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="flex justify-between items-center mb-12 -mt-2">
                {/* Remember me checkbox */}
                <div className="flex items-center">
                  <Checkbox inputId="rememberMe" className="p-checkbox ml-0 md:ml-1" checked={rememberMe} onChange={(e) => setRememberMe(e.checked ?? false)} />
                  <label className="ml-2 text-base text-black">Remember me</label>
                </div>
                  
                <button
                  type="button"
                  className="link-button forgot-password-link text-base mr-0 md:mr-1"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button with ProgressSpinner */}
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (
                  <ProgressSpinner
                    style={{ width: '20px', height: '20px' }}
                    strokeWidth="5"
                    animationDuration="2s"
                  />
                ) : (
                  'LOGIN'
                )}
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
                {loading ? (
                  <ProgressSpinner
                    style={{ width: '20px', height: '20px' }}
                    strokeWidth="5"
                    animationDuration="2s"
                  />
                ) : (
                  'Send Reset Password'
                )}
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
