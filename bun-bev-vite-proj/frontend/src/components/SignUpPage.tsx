import React, { useState } from 'react';
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';
import api from '../services/api';
import { Tooltip } from 'primereact/tooltip';
import { ProgressSpinner } from 'primereact/progressspinner';

interface SignUpPageProps {
  showToast: (severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined, summary: string, detail: string) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ showToast }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showToast('error', 'Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.register({
        email: email,
        username: username,
        password: password,
      });

      console.log('User registered successfully:', response.data);
      showToast('success', 'Success', 'Registered successfully!');

      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');

      navigate('/login');
    } catch (error: unknown) {
      console.error('Error registering user: ', error);

      const err = error as { response?: { status: number, data: { message: string } } };
      if (err.response && err.response.status === 400) {
        showToast('error', 'Error', err.response.data.message);
      } else {
        showToast('error', 'Error', 'Failed to register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page signup-page">
      <div className="auth-card">
        <h2 className="auth-title">Sign Up</h2>
        <form onSubmit={handleSignUp}>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-field"
              autoComplete="off"
            />
          </div>
          <div className="input-group">
            <div style={{ position: 'relative', flex: 1 }}>
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <FaInfoCircle
              id="passwordTooltip"
              className="info-icon"
              data-pr-tooltip="Password must contain at least: 
              - 8 characters
              - one uppercase letter
              - one lowercase letter
              - one number
              - one symbol"
              data-pr-position="right"
            />
            <Tooltip target="#passwordTooltip" />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field"
              autoComplete="new-password"
            />
          </div>
          {/* Sign Up Button with ProgressSpinner */}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <ProgressSpinner
                style={{ width: '20px', height: '20px' }}
                strokeWidth="5"
                animationDuration="2s"
              />
            ) : (
              'SIGN UP'
            )}
          </button>
        </form>
        <div className="option-section">
          <p>Already have an account?</p>
          <Link to="/login" className="option-link">
            LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
