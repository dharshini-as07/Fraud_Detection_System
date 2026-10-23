import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [upiPin, setUpiPin] = useState(user?.upiPin || '1234');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirm password do not match.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters in length.');
        return;
      }
    }

    if (upiPin && (upiPin.length !== 4 || isNaN(upiPin))) {
      setErrorMsg('UPI PIN must be exactly 4 digits.');
      return;
    }

    try {
      setLoading(true);
      const payload = { name, phone, upiId, upiPin };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await API.put('/auth/profile', payload);
      if (res.data.success) {
        updateUser(res.data.user);
        setSuccessMsg('Profile & UPI settings updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <User size={20} color="#2563eb" />
            <span>Customer Profile & UPI Security Settings</span>
          </div>
        </div>

        {successMsg && (
          <div className="alert-box success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert-box error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Read-Only Account Details */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Account Email</span>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>{user?.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>System Role</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2563eb', textTransform: 'uppercase' }}>
                  {user?.role}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active UPI ID</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{user?.upiId || 'Not set'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Default UPI PIN</span>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>•••• ({user?.upiPin || '1234'})</div>
              </div>
            </div>
          </div>

          {/* Editable Personal Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="yourname@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">4-Digit UPI PIN</label>
              <input
                type="password"
                maxLength={4}
                className="form-input"
                placeholder="4-digit PIN (e.g. 1234)"
                value={upiPin}
                onChange={(e) => setUpiPin(e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', margin: '24px 0 20px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontWeight: 700, fontSize: '0.95rem' }}>
              <Lock size={18} color="#2563eb" />
              <span>Change Password (Optional)</span>
            </div>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Required only if changing password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: '12px 24px', marginTop: '10px' }}
          >
            <Save size={16} />
            <span>{loading ? 'Saving Changes...' : 'Save Profile Details'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
