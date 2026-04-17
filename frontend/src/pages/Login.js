import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/authService';

function Login({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser(form);
      onAuthSuccess(data.user, data.token);
      toast.success('Login successful');

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
          <p className="auth-kicker">Welcome Back</p>
          <h2>Access your account instantly</h2>
          <p>
            Track orders, manage profile, and continue shopping with your personalized dashboard.
          </p>
        </section>

        <form className="auth-card modern-auth-card" onSubmit={onSubmit}>
          <h2>Login</h2>
          <p className="auth-subtitle">Enter your credentials to continue.</p>

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
              placeholder="Enter password"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="auth-switch-note">
            No account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
