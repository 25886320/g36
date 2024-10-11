import React, { useState } from 'react';
import { FaUser } from 'react-icons/fa';

interface ForgotPasswordPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string) => void;
}

const ForgotPasswordPopup: React.FC<ForgotPasswordPopupProps> = ({ isOpen, onClose, onSubmit }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username);
    setUsername('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group relative mb-4">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>
          <button type="submit" className="login-button w-full mb-2">
            Send Reset Email
          </button>
          <button onClick={onClose} className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPopup;
