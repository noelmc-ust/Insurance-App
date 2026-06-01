import React, { FormEvent, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { API_BASE, api, getToken } from "./services/api";
import "./styles.css";

type User = { id: number; name: string; email: string; role: "ADMIN" | "USER" };

function useSession() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (!getToken()) return;
    api("/api/auth/me").then((u) => setUser({ id: u.Id, name: u.Name, email: u.Email, role: u.Role })).catch(() => localStorage.removeItem("token"));
  }, []);
  return { user, setUser };
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }) });
      localStorage.setItem("token", res.token);
      onLogin(res.user);
      nav("/");
    } catch {
      setError("Login failed. Check backend is running and credentials are correct.");
    } finally {
      setLoading(false);
    }
  }
  return <div className="auth-wrap"><form onSubmit={submit} className="panel auth"><h2>Insurance Claims Portal</h2><input name="email" placeholder="Email" defaultValue="user@insurance.local" /><input name="password" placeholder="Password" type="password" defaultValue="User@123" />{error && <p className="err">{error}</p>}<button disabled={loading}>{loading ? "Signing in..." : "Login"}</button><small>Demo users: admin@insurance.local / user@insurance.local</small><p><Link to="/signup">Create account</Link></p><p><Link to="/">Back to Home</Link></p></form></div>;
}

function Signup() {
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password") })
      });
      setOk("Account created. Please login.");
      setTimeout(() => nav("/login"), 1000);
    } catch {
      setError("Signup failed. Email may already exist.");
    }
  }
  return <div className="auth-wrap"><form onSubmit={submit} className="panel auth"><h2>Create Account</h2><input name="name" placeholder="Full Name" required /><input name="email" type="email" placeholder="Email" required /><input name="password" type="password" placeholder="Password (min 8 chars)" minLength={8} required />{error && <p className="err">{error}</p>}{ok && <p className="ok">{ok}</p>}<button>Create Account</button><p><Link to="/login">Back to Login</Link></p></form></div>;
}

function Landing() {
  return (
    <div className="landing">
      <header className="hero">
        <div>
          <h1>Insurance Claims Platform</h1>
          <p>Azure Blob Storage training app with secure uploads, private documents, and role-based claim workflow.</p>
          <div className="cta">
            <Link to="/login" className="btn-primary">Login</Link>
          </div>
        </div>
      </header>
      <section className="features">
        <article className="feature"><h3>Secure Uploads</h3><p>Files are stored in private blob container paths per user and claim.</p></article>
        <article className="feature"><h3>SAS Viewing</h3><p>Documents are viewed in browser through temporary read-only SAS URLs.</p></article>
        <article className="feature"><h3>Admin Control</h3><p>Approve/reject claims with status tracking and comments.</p></article>
      </section>
    </div>
  );
}

function UserHome() {
  const [claims, setClaims] = useState<any[]>([]);
  useEffect(() => { api("/api/claims").then(setClaims); }, []);
  return <div className="panel"><h2>My Claims</h2><div className="list">{claims.map((c) => <p className="row" key={c.Id}><Link to={`/claims/${c.Id}`}>Claim #{c.Id}</Link> <span className={`badge ${c.Status}`}>{c.Status}</span></p>)}</div></div>;
}

function ClaimCreate() {
  const nav = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`${API_BASE}/api/claims`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
    nav("/");
  }
  return <form onSubmit={submit} className="panel"><h2>Create Claim</h2><input name="fullName" placeholder="Full Name" required /><input name="policyNumber" placeholder="Policy Number" required /><input name="claimType" placeholder="Claim Type" required /><input name="claimAmount" type="number" step="0.01" placeholder="Claim Amount" required /><textarea name="description" placeholder="Description" required /><input name="documents" type="file" multiple /><button>Submit Claim</button></form>;
}

function ClaimDetails() {
  const id = window.location.pathname.split("/").pop();
  const [data, setData] = useState<any>(null);
  useEffect(() => { api(`/api/claims/${id}`).then(setData); }, [id]);
  async function openDoc(docId: number) {
    const r = await api(`/api/documents/${docId}/view-url`);
    window.open(r.url, "_blank");
  }
  if (!data) return <div className="panel">Loading...</div>;
  return <div className="panel"><h2>Claim #{data.claim.Id}</h2><p>Status: <span className={`badge ${data.claim.Status}`}>{data.claim.Status}</span></p><p>Admin Comment: {data.claim.AdminComment || "-"}</p><h3>Documents</h3><div className="list">{data.documents.map((d: any) => <p className="row" key={d.Id}><span>{d.FileName}</span><button onClick={() => openDoc(d.Id)}>Open</button></p>)}</div></div>;
}

function AdminHome() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  useEffect(() => { api("/api/admin/stats").then(setStats); api("/api/admin/users").then(setUsers); api("/api/admin/claims?status=ALL").then(setClaims); }, []);
  async function updateStatus(id: number, status: string) {
    await api(`/api/admin/claims/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, adminComment: `Updated to ${status}` }) });
    setClaims(await api("/api/admin/claims?status=ALL"));
  }
  if (!stats) return <div className="panel">Loading...</div>;
  return <div className="grid">
    <div className="panel"><h2>Stats</h2><p>Total Claims: {stats.totalClaims}</p><p>Pending: {stats.pendingClaims}</p><p>Approved: {stats.approvedClaims}</p><p>Rejected: {stats.rejectedClaims}</p><p>Total Users: {stats.totalUsers}</p></div>
    <div className="panel"><h2>Users</h2><div className="list">{users.map((u) => <p className="row" key={u.Id}><span>{u.Name} ({u.Role})</span><span>Claims: {u.ClaimsCount}</span></p>)}</div></div>
    <div className="panel"><h2>Claims</h2><div className="list">{claims.map((c) => <p className="row" key={c.Id}><span>#{c.Id} {c.UserName} <span className={`badge ${c.Status}`}>{c.Status}</span></span><span><button onClick={() => updateStatus(c.Id, "APPROVED")}>Approve</button> <button onClick={() => updateStatus(c.Id, "REJECTED")}>Reject</button> <Link to={`/claims/${c.Id}`}>Open</Link></span></p>)}</div></div>
  </div>;
}

function Shell() {
  const { user, setUser } = useSession();
  const logout = () => { localStorage.removeItem("token"); location.href = "/"; };
  const links = useMemo(() => user?.role === "ADMIN" ? [{ to: "/", label: "Admin" }] : [{ to: "/", label: "Dashboard" }, { to: "/new-claim", label: "New Claim" }], [user]);
  if (!getToken()) return <Navigate to="/login" replace />;
  return <div className="layout"><aside className="sidebar"><h3>Insurance App</h3><p>{user?.name}</p><div className="menu">{links.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}</div><button onClick={logout}>Logout</button></aside><main><Routes><Route path="/" element={user?.role === "ADMIN" ? <AdminHome /> : <UserHome />} /><Route path="/new-claim" element={<ClaimCreate />} /><Route path="/claims/:id" element={<ClaimDetails />} /></Routes></main></div>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  return <BrowserRouter><Routes><Route path="/" element={getToken() ? <Navigate to="/app" replace /> : <Landing />} /><Route path="/login" element={getToken() ? <Navigate to="/app" replace /> : <Login onLogin={setUser} />} /><Route path="/signup" element={getToken() ? <Navigate to="/app" replace /> : <Signup />} /><Route path="/app/*" element={<Shell key={user?.id || 0} />} /></Routes></BrowserRouter>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
