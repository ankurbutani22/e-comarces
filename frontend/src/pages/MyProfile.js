import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../services/authService';
import { readLocalJson } from '../utils/storage';

function MyProfile({ token, onProfileUpdated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile(token);
        const user = response.user;
        setForm({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: user?.address || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) {
      setError('Phone number must be 10 digits');
      return;
    }

    try {
      setSaving(true);
      const response = await updateProfile(token, {
        name: form.name,
        phone: form.phone,
        address: form.address
      });

      const updatedUser = {
        ...(readLocalJson('user', {})),
        ...response.user,
        id: response.user?._id || response.user?.id
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated(updatedUser);
      }

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-shell">
      <div className="profile-card">
        <h2>My Profile</h2>
        {error ? <div className="error profile-msg">{error}</div> : null}
        {success ? <div className="success-msg profile-msg">{success}</div> : null}

        <form onSubmit={onSubmit} className="profile-form">
          <div>
            <label>Name</label>
            <input name="name" value={form.name} onChange={onChange} required />
          </div>

          <div>
            <label>Email</label>
            <input name="email" value={form.email} readOnly className="readonly-field" />
          </div>

          <div>
            <label>Phone Number</label>
            <input name="phone" value={form.phone} onChange={onChange} placeholder="10 digit number" />
          </div>

          <div>
            <label>Address</label>
            <textarea name="address" value={form.address} onChange={onChange} rows={4} />
          </div>

          <button type="submit" disabled={saving} className="profile-save-btn">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MyProfile;
