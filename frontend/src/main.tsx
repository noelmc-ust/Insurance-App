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
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }) });
    localStorage.setItem("token", res.token);
    onLogin(res.user);
    nav("/");
  }
  return <form onSubmit={submit} className="panel"><h2>Login</h2><input name="email" placeholder="Email" defaultValue="user@insurance.local" /><input name="password" placeholder="Password" type="password" defaultValue="User@123" /><button>Login</button></form>;
}

function UserHome() {
  const [claims, setClaims] = useState<any[]>([]);
  useEffect(() => { api("/api/claims").then(setClaims); }, []);
  return <div className="panel"><h2>My Claims</h2>{claims.map((c) => <p key={c.Id}><Link to={`/claims/${c.Id}`}>Claim #{c.Id}</Link> - <b>{c.Status}</b></p>)}</div>;
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
  return <div className="panel"><h2>Claim #{data.claim.Id}</h2><p>Status: <b>{data.claim.Status}</b></p><p>Admin Comment: {data.claim.AdminComment || "-"}</p><h3>Documents</h3>{data.documents.map((d: any) => <p key={d.Id}><button onClick={() => openDoc(d.Id)}>Open</button> {d.FileName}</p>)}</div>;
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
    <div className="panel"><h2>Users</h2>{users.map((u) => <p key={u.Id}>{u.Name} ({u.Role}) - claims: {u.ClaimsCount}</p>)}</div>
    <div className="panel"><h2>Claims</h2>{claims.map((c) => <p key={c.Id}>#{c.Id} {c.UserName} - {c.Status} <button onClick={() => updateStatus(c.Id, "APPROVED")}>Approve</button> <button onClick={() => updateStatus(c.Id, "REJECTED")}>Reject</button> <Link to={`/claims/${c.Id}`}>Open</Link></p>)}</div>
  </div>;
}

function Shell() {
  const { user, setUser } = useSession();
  const logout = () => { localStorage.removeItem("token"); location.href = "/"; };
  const links = useMemo(() => user?.role === "ADMIN" ? [{ to: "/", label: "Admin" }] : [{ to: "/", label: "Dashboard" }, { to: "/new-claim", label: "New Claim" }], [user]);
  if (!getToken()) return <Navigate to="/login" replace />;
  return <div><nav>{links.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)} <button onClick={logout}>Logout</button></nav><Routes><Route path="/" element={user?.role === "ADMIN" ? <AdminHome /> : <UserHome />} /><Route path="/new-claim" element={<ClaimCreate />} /><Route path="/claims/:id" element={<ClaimDetails />} /></Routes></div>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  return <BrowserRouter><Routes><Route path="/login" element={<Login onLogin={setUser} />} /><Route path="/*" element={<Shell key={user?.id || 0} />} /></Routes></BrowserRouter>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
