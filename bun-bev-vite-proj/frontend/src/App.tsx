import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import HomePage from './components/HomePage';
import NotePage from './components/Note';
import { Toast } from 'primereact/toast';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;  // Token expiration time
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  const checkTokenValidity = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      // Check if the token has three parts separated by '.'
      if (token.split('.').length !== 3) {
        console.error('Invalid token format');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        return;
      }

      try {
        const decoded: DecodedToken = jwtDecode(token);
        
        const currentTime = Date.now() / 1000;

        console.log('Token expires:', decoded.exp);
        console.log('Current time:', currentTime);

        if (decoded.exp && decoded.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          showToast('warn', 'Session Expired', 'Token expired, logging out!');
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkTokenValidity();  // Initial check on mount
    const intervalId = setInterval(checkTokenValidity, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Function to show toast notifications
  const showToast = (severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined, summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail });
  };

  // Function to handle login
  const login = (token: string, rememberMe: boolean) => {
    if (rememberMe) {
      // Store token in localStorage for 30 days
      localStorage.setItem('token', token);
      console.log("Token stored in local storage -- remember me");
    } else {
      // Store token in sessionStorage for 1 hour (or until user closes browser)
      sessionStorage.setItem('token', token);
    }
    setIsAuthenticated(true);
    showToast('success', 'Welcome!', 'You have successfully logged in.');
  };

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setIsAuthenticated(false);
    showToast('info', 'Logged Out', 'You have successfully logged out.');
  };

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const UnprotectedRoute = ({ children }: { children: JSX.Element }) => {
    return !isAuthenticated ? children : <Navigate to="/home" />;
  };

  return (
    <Router>
      <Toast ref={toast} className="rounded-lg" />
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/login" element={<UnprotectedRoute><LoginPage login={login} showToast={showToast} /></UnprotectedRoute>} />
        <Route path="/signup" element={<UnprotectedRoute><SignUpPage showToast={showToast} /></UnprotectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomePage logout={logout} showToast={showToast} /></ProtectedRoute>} />
        <Route path="/notes/:noteId" element={<ProtectedRoute><NotePage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
