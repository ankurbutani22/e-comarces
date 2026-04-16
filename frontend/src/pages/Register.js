import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';

function Register({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await registerUser(form);
      onAuthSuccess(data.user, data.token);

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'delivery_boy') {
        navigate('/delivery');
      } else if (data.user.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server not reachable. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-shell">
        <section className="auth-side-panel">
          <p className="auth-kicker">Join Us</p>
          <h2>Create your store-ready account</h2>
          <p>
            Register as customer or seller and unlock a fast, modern shopping experience.
          </p>
        </section>

        <form className="auth-card modern-auth-card" onSubmit={onSubmit}>
          <h2>Register</h2>
          <p className="auth-subtitle">Create your account in less than a minute.</p>
          {error ? <p className="error">{error}</p> : null}

          <div className="auth-field">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={onChange}
              required
              minLength={6}
            />
          </div>

          <div className="auth-field">
            <label>Role</label>
            <select name="role" value={form.role} onChange={onChange}>
              <option value="user">User</option>
              <option value="seller">Seller</option>
              <option value="delivery_boy">Delivery Boy</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? 'Registering...' : 'Register'}
          </button>

          <p className="auth-switch-note">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
