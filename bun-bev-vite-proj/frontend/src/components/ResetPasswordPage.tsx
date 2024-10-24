import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Toast } from 'primereact/toast';
import '../styles/ResetPasswordPage.css';

const ResetPasswordPage: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const query = new URLSearchParams(useLocation().search);
    const token = query.get('token');
    const toast = React.useRef<Toast>(null);
    const navigate = useNavigate();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!token) {
                throw new Error('Token is required for password reset.');
            }
            const response = await api.resetPassword(token, newPassword);
            setMessage(response.data.message);
            toast.current?.show({ severity: 'success', summary: 'Success', detail: response.data.message });
        } catch (error: unknown) {
            console.error('Error resetting password:', error);

            const err = error as { response?: { status: number, data: { message: string } } };
            setMessage('Failed to reset password.');
            if (err.response && err.response.status === 400) {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response.data.message });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to reset password.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-container">
            <Toast ref={toast} className="rounded-lg" />
            <div className="reset-password-box">
                <h2>Reset Password</h2>
                <form onSubmit={handleResetPassword}>
                    <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="password-input"
                    />
                    <button type="submit" disabled={loading} className="reset-button">
                        {loading ? 'Loading...' : 'Reset Password'}
                    </button>
                </form>
                <button 
                    onClick={() => navigate('/login')}
                    className="return-button"
                >
                    Return to Login
                </button>
                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
