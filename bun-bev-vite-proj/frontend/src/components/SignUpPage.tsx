import React, { useState } from 'react';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';
import api from '../services/api';

interface SignUpPageProps {
  showToast: (severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined, summary: string, detail: string) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ showToast }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

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

      navigate('/login');
    } catch (error: unknown) {
      console.error('Error registering user: ', error);

      const err = error as { response?: { status: number, data: { message: string } } };
      if (err.response && err.response.status === 400) {
        showToast('error', 'Error', err.response.data.message);
      } else {
        showToast('error', 'Error', 'Failed to register. Please try again.');
      }
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
            />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <button type="submit" className="auth-button">
            SIGN UP
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
