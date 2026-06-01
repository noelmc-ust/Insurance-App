import React, { FormEvent, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { LogOut } from "lucide-react";
import { API_BASE, api, getToken } from "./services/api";
import "./styles.css";

type User = { id: number; name: string; email: string; role: "ADMIN" | "USER" };

function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!getToken()) return setLoading(false);
    api("/api/auth/me")
      .then((u) => setUser({ id: u.Id, name: u.Name, email: u.Email, role: u.Role }))
      .finally(() => setLoading(false));
  }, []);
  return { user, setUser, loading };
}

function Landing() {
  return (
    <div className="landing">
      <header className="hero">
        <p className="eyebrow">Enterprise Blob Training Project</p>
        <h1>Insurance Claims Platform</h1>
        <p>Secure claims workflow with Azure Blob document storage, private access, role-based approvals, and auditable status transitions.</p>
        <div className="hero-actions">
          <Link to="/login" className="btn">Login</Link>
          <Link to="/signup" className="btn ghost">Create Account</Link>
        </div>
      </header>
      <section className="landing-grid">
        <article className="landing-card"><h3>Secure Uploads</h3><p>Documents are uploaded with metadata tracking in SQL and object storage in Blob.</p></article>
        <article className="landing-card"><h3>Role Control</h3><p>Admins review all claims, users see only their own claim history and outcomes.</p></article>
        <article className="landing-card"><h3>Closed Decisions</h3><p>Approved or rejected claims become immutable for safer and clearer operations.</p></article>
      </section>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") })
      });
      localStorage.setItem("token", res.token);
      onLogin(res.user);
      nav("/app");
    } catch {
      setError("Login failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-wrap">
      <form onSubmit={submit} className="card auth">
        <h2>Login</h2>
        <input name="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        {error && <p className="err">{error}</p>}
        <button className="btn full" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
        <p><Link to="/signup">Create account</Link></p>
      </form>
    </div>
  );
}

function Signup() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg("");
    setErr("");
    try {
      await api("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password") })
      });
      setMsg("Account created. Redirecting to login...");
      setTimeout(() => nav("/login"), 900);
    } catch {
      setErr("Signup failed.");
    }
  }
  return <div className="auth-wrap"><form onSubmit={submit} className="card auth"><h2>Create Account</h2><input name="name" placeholder="Full Name" required /><input name="email" type="email" placeholder="Email" required /><input name="password" type="password" placeholder="Password" minLength={8} required />{err && <p className="err">{err}</p>}{msg && <p className="ok">{msg}</p>}<button className="btn full">Create</button></form></div>;
}

function UserDashboard() {
  const [claims, setClaims] = useState<any[]>([]);
  useEffect(() => { api("/api/claims").then(setClaims); }, []);
  return <div className="card"><h2>My Claims</h2><div className="table">{claims.map((c) => <div className="tr" key={c.Id}><Link to={`/app/claims/${c.Id}`}>Claim #{c.Id}</Link><span className={`badge ${c.Status}`}>{c.Status}</span></div>)}</div></div>;
}

function ClaimCreate() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch(`${API_BASE}/api/claims`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
      nav("/app");
    } finally {
      setBusy(false);
    }
  }
  return <form className="card form-grid" onSubmit={submit}><h2>New Claim</h2><input name="fullName" placeholder="Full Name" required /><input name="policyNumber" placeholder="Policy Number" required /><input name="claimType" placeholder="Claim Type" required /><input name="claimAmount" type="number" step="0.01" placeholder="Claim Amount" required /><textarea name="description" placeholder="Description" required /><input name="documents" type="file" multiple /><button className="btn" disabled={busy}>{busy ? "Submitting..." : "Submit Claim"}</button></form>;
}

function ClaimDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  useEffect(() => { api(`/api/claims/${id}`).then(setData); }, [id]);
  async function openDoc(docId: number) {
    const r = await api(`/api/documents/${docId}/view-url`);
    window.open(r.url, "_blank");
  }
  if (!data) return <div className="card">Loading...</div>;
  return <div className="card"><h2>Claim #{data.claim.Id}</h2><p>Status: <span className={`badge ${data.claim.Status}`}>{data.claim.Status}</span></p><p>Admin Comment: {data.claim.AdminComment || "-"}</p><h3>Documents</h3><div className="table">{data.documents.map((d: any) => <div className="tr" key={d.Id}><span>{d.FileName}</span><button className="btn small" onClick={() => openDoc(d.Id)}>Open</button></div>)}</div></div>;
}

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { api("/api/admin/stats").then(setStats); }, []);
  if (!stats) return <div className="card">Loading...</div>;
  return <div className="stats">{Object.entries(stats).map(([k, v]) => <div className="stat" key={k}><p>{k}</p><h2>{String(v)}</h2></div>)}</div>;
}

function AdminClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [comments, setComments] = useState<Record<number, string>>({});
  async function load() { setClaims(await api("/api/admin/claims?status=ALL")); }
  useEffect(() => { load(); }, []);
  async function update(id: number, status: "APPROVED" | "REJECTED") {
    await api(`/api/admin/claims/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, adminComment: comments[id] || "" }) });
    await load();
  }
  return <div className="card"><h2>All Claims</h2><div className="table">{claims.map((c) => { const closed = c.Status !== "PENDING"; return <div className="tr-col" key={c.Id}><div className="tr"><span>#{c.Id} {c.UserName}</span><span className={`badge ${c.Status}`}>{c.Status}</span></div><small>{c.PolicyNumber} | {c.ClaimType}</small><input placeholder="Admin comment" disabled={closed} value={comments[c.Id] || ""} onChange={(e) => setComments((x) => ({ ...x, [c.Id]: e.target.value }))} /><div className="actions"><Link className="btn small ghost" to={`/app/claims/${c.Id}`}>Open</Link><button className="btn small" disabled={closed} onClick={() => update(c.Id, "APPROVED")}>Approve</button><button className="btn small danger" disabled={closed} onClick={() => update(c.Id, "REJECTED")}>Reject</button></div></div>; })}</div></div>;
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { api("/api/admin/users").then(setUsers); }, []);
  return <div className="card"><h2>Platform Users</h2><div className="table">{users.map((u) => <div className="tr" key={u.Id}><span>{u.Name} ({u.Role}) - {u.Email}<br /><small>Created: {new Date(u.CreatedAt).toLocaleString()}</small></span><span>Claims: {u.ClaimsCount}</span></div>)}</div></div>;
}

function AppShell() {
  const { user, loading } = useSession();
  if (loading) return <div className="auth-wrap">Loading...</div>;
  if (!getToken() || !user) return <Navigate to="/login" replace />;
  const links = user.role === "ADMIN"
    ? [{ to: "/app", label: "Dashboard" }, { to: "/app/admin/claims", label: "Claims" }, { to: "/app/admin/users", label: "Users" }]
    : [{ to: "/app", label: "Dashboard" }, { to: "/app/new-claim", label: "New Claim" }];
  return (
    <div>
      <nav className="topnav">
        <h3>Insurance App</h3>
        <div className="navlinks">{links.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}</div>
        <button className="btn small nav-logout" onClick={() => { localStorage.removeItem("token"); location.href = "/"; }}><LogOut size={14} />Sign out</button>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={user.role === "ADMIN" ? <AdminDashboard /> : <UserDashboard />} />
          <Route path="/new-claim" element={<ClaimCreate />} />
          <Route path="/claims/:id" element={<ClaimDetails />} />
          <Route path="/admin/claims" element={<AdminClaims />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={getToken() ? <Navigate to="/app" replace /> : <Landing />} />
        <Route path="/login" element={getToken() ? <Navigate to="/app" replace /> : <Login onLogin={setSessionUser} />} />
        <Route path="/signup" element={getToken() ? <Navigate to="/app" replace /> : <Signup />} />
        <Route path="/app/*" element={<AppShell key={sessionUser?.id || 0} />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
