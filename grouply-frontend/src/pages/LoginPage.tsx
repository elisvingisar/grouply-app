import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import "./AuthPages.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/events");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand" aria-label="Grouply welcome">
        <p className="auth-brand__name">Grouply</p>
        <h1 className="auth-brand__slogan">Split costs. Keep the peace.</h1>
        <p className="auth-brand__hint">
          Track shared expenses for trips and groups — fair shares without the awkward math.
        </p>
      </section>

      <section className="auth-panel" aria-label="Log in">
        <h2 className="auth-panel__title">Log in</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@localhost"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-actions">
            <button
              type="submit"
              className="auth-btn auth-btn--primary"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            <div className="auth-divider" aria-hidden="true">
              or
            </div>

            <Link to="/register" className="auth-btn auth-btn--secondary">
              Create new account
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
