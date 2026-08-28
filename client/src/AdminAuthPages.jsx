import { useState } from "react";
import { setAdminSession } from "./auth.js";

function Field({ label, ...inputProps }) {
  return (
    <label>
      <span>{label}</span>
      <input {...inputProps} />
    </label>
  );
}

// This login is for admins only — normal visitors get no benefit from an
// account, so it's the only auth link that appears in the navbar. There is
// no public registration page: admin accounts are created directly in the
// database (see server/scripts/createAdmin.js).
export function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not log in");

      setAdminSession({ token: result.token, name: result.user.name, email: result.user.email });
      window.location.href = "/crowdfunding";
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card section-shell">
        <p className="section-kicker">Admins Only</p>
        <h1>Admin Login</h1>
        <p className="auth-subtext">
          Regular visitors don&apos;t need an account — this login is only useful for festival admins.
        </p>

        {error && <p className="status-message error-message">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            placeholder="admin@example.com"
            autoComplete="username"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <div className="form-actions">
            <a className="secondary-action" href="/">
              Back to home
            </a>
            <button className="primary-link button-link" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
