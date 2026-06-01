import React, { FormEvent, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { FileText, LogOut, Shield, Upload } from "lucide-react";
import { api, getToken } from "./services/api";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import "./styles.css";

type User = { id: number; name: string; email: string; role: "ADMIN" | "USER" };
const statusVariant = (s: string) => (s === "APPROVED" ? "approved" : s === "REJECTED" ? "rejected" : "pending");

function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!getToken()) return setLoading(false);
    api("/api/auth/me").then((u) => setUser({ id: u.Id, name: u.Name, email: u.Email, role: u.Role })).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, []);
  return { user, loading };
}

function Landing() {
  return <div className="min-h-screen bg-slate-950 text-slate-100"><div className="mx-auto max-w-6xl px-6 py-20"><p className="text-sky-300">Azure Blob Training Project</p><h1 className="mt-3 text-5xl font-bold">Insurance Claims Platform</h1><p className="mt-4 max-w-3xl text-slate-300">Secure upload, claim review, private document viewing, and auditable status flow.</p><div className="mt-8 flex gap-3"><Link to="/login"><Button><Shield size={16}/>Login</Button></Link><Link to="/signup"><Button variant="ghost">Create Account</Button></Link></div><div className="mt-10 grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Blob Security</CardTitle></CardHeader><CardContent>Private container, scoped read access, and tracked document metadata.</CardContent></Card><Card><CardHeader><CardTitle>Claims Workflow</CardTitle></CardHeader><CardContent>User submission with admin approval/rejection and comments.</CardContent></Card><Card><CardHeader><CardTitle>Operational Visibility</CardTitle></CardHeader><CardContent>Dashboards for stats, users, and full claim lifecycle.</CardContent></Card></div></div></div>;
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const nav = useNavigate(); const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); try { const res = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }) }); localStorage.setItem("token", res.token); onLogin(res.user); nav("/app"); } catch { setErr("Login failed."); } }
  return <div className="grid min-h-screen place-items-center bg-slate-950 p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>Login</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={submit}><Input name="email" placeholder="Email" required /><Input name="password" type="password" placeholder="Password" required />{err && <p className="text-sm text-rose-400">{err}</p>}<Button className="w-full">Sign In</Button><p className="text-sm text-slate-400">No account? <Link to="/signup" className="text-sky-300">Create one</Link></p></form></CardContent></Card></div>;
}

function Signup() {
  const nav = useNavigate(); const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); setErr(""); try { await api("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password") }) }); setOk("Account created."); setTimeout(() => nav("/login"), 800); } catch { setErr("Signup failed."); } }
  return <div className="grid min-h-screen place-items-center bg-slate-950 p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>Create Account</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={submit}><Input name="name" placeholder="Full Name" required /><Input name="email" type="email" placeholder="Email" required /><Input name="password" type="password" placeholder="Password" minLength={8} required />{err && <p className="text-sm text-rose-400">{err}</p>}{ok && <p className="text-sm text-emerald-400">{ok}</p>}<Button className="w-full">Create Account</Button></form></CardContent></Card></div>;
}

function UserDashboard() {
  const [claims, setClaims] = useState<any[] | null>(null);
  useEffect(() => { api("/api/claims").then(setClaims); }, []);
  return (
    <Card>
      <CardHeader><CardTitle>My Claims</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {claims === null && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-md bg-slate-800/70" />)}
        {claims?.length === 0 && <div className="rounded-md border border-dashed border-slate-700 p-6 text-center text-slate-400">No claims yet. Create your first claim.</div>}
        {claims?.map((c) => (
          <div key={c.Id} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/50 p-3 transition hover:border-sky-600/40">
            <Link to={`/app/claims/${c.Id}`} className="text-sky-300">Claim #{c.Id}</Link>
            <Badge variant={statusVariant(c.Status) as any}>{c.Status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClaimCreate() { const nav = useNavigate(); async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); await fetch("/api/claims", { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd }); nav("/app"); } return <Card><CardHeader><CardTitle>New Claim</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={submit}><Input name="fullName" placeholder="Full Name" required /><Input name="policyNumber" placeholder="Policy Number" required /><Input name="claimType" placeholder="Claim Type" required /><Input name="claimAmount" type="number" step="0.01" placeholder="Claim Amount" required /><Textarea name="description" placeholder="Description" required /><Input name="documents" type="file" multiple /><Button><Upload size={16}/>Submit Claim</Button></form></CardContent></Card>; }

function ClaimDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  useEffect(() => { api(`/api/claims/${id}`).then(setData); }, [id]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  async function openDoc(docId:number, fileName:string){
    const res=await fetch(`/api/documents/${docId}/content`,{headers:{Authorization:`Bearer ${getToken()}`}});
    const blob=await res.blob();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
    setPreviewName(fileName);
  }
  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
  }
  if (!data) return <Card><CardContent className="space-y-2 pt-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-slate-800/70" />)}</CardContent></Card>;
  return <>
    <Card><CardHeader><CardTitle>Claim #{data.claim.Id}</CardTitle></CardHeader><CardContent><p className="mb-2">Status: <Badge variant={statusVariant(data.claim.Status) as any}>{data.claim.Status}</Badge></p><p className="mb-4 text-slate-300">Admin Comment: {data.claim.AdminComment || "-"}</p><div className="space-y-2">{data.documents.length === 0 ? <div className="rounded-md border border-dashed border-slate-700 p-6 text-center text-slate-400">No documents uploaded.</div> : data.documents.map((d:any)=><div key={d.Id} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/50 p-3 transition hover:border-sky-600/40"><span>{d.FileName}</span><Button size="sm" variant="secondary" onClick={()=>openDoc(d.Id, d.FileName)}><FileText size={14}/>Open</Button></div>)}</div></CardContent></Card>
    {previewUrl && (
      <div className="fixed inset-0 z-50 bg-black/80 p-4">
        <div className="mx-auto flex h-full max-w-6xl flex-col rounded-xl border border-slate-700 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <p className="truncate text-sm text-slate-200">{previewName}</p>
            <Button size="sm" variant="ghost" onClick={closePreview}>Close</Button>
          </div>
          <div className="flex-1 p-2">
            <iframe title={previewName} src={previewUrl} className="h-full w-full rounded-md bg-white" />
          </div>
        </div>
      </div>
    )}
  </>;
}

function AdminDashboard() { const [stats, setStats] = useState<any>(null); useEffect(() => { api("/api/admin/stats").then(setStats); }, []); if (!stats) return <div className="grid gap-3 md:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/70" />)}</div>; return <div className="grid gap-3 md:grid-cols-5">{Object.entries(stats).map(([k,v])=><Card key={k}><CardContent className="pt-5"><p className="text-xs uppercase tracking-wide text-slate-400">{k}</p><p className="mt-2 text-2xl font-bold">{String(v)}</p></CardContent></Card>)}</div>; }

function AdminClaims() { const [claims,setClaims]=useState<any[]>([]); const [comments,setComments]=useState<Record<number,string>>({}); const load=()=>api("/api/admin/claims?status=ALL").then(setClaims); useEffect(()=>{load();},[]); async function update(id:number,status:"APPROVED"|"REJECTED"){await api(`/api/admin/claims/${id}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,adminComment:comments[id]||""})}); load();} return <Card><CardHeader><CardTitle>All Claims</CardTitle></CardHeader><CardContent className="space-y-3">{claims.map((c)=><div key={c.Id} className="space-y-2 rounded-md border border-slate-700 bg-slate-900/50 p-3"><div className="flex items-center justify-between"><span>#{c.Id} {c.UserName}</span><Badge variant={statusVariant(c.Status) as any}>{c.Status}</Badge></div><Input disabled={c.Status!=="PENDING"} placeholder="Admin comment" value={comments[c.Id]||""} onChange={(e)=>setComments((x)=>({...x,[c.Id]:e.target.value}))}/><div className="flex flex-wrap gap-2"><Link to={`/app/claims/${c.Id}`}><Button size="sm" variant="ghost">Open</Button></Link><Button size="sm" disabled={c.Status!=="PENDING"} onClick={()=>update(c.Id,"APPROVED")}>Approve</Button><Button size="sm" variant="danger" disabled={c.Status!=="PENDING"} onClick={()=>update(c.Id,"REJECTED")}>Reject</Button></div></div>)}</CardContent></Card>; }

function AdminUsers(){const [users,setUsers]=useState<any[]|null>(null); useEffect(()=>{api("/api/admin/users").then(setUsers);},[]); return <Card><CardHeader><CardTitle>Platform Users</CardTitle></CardHeader><CardContent className="space-y-2">{users===null && Array.from({ length: 4 }).map((_,i)=><div key={i} className="h-12 animate-pulse rounded-md bg-slate-800/70" />)}{users?.length===0 && <div className="rounded-md border border-dashed border-slate-700 p-6 text-center text-slate-400">No users found.</div>}{users?.map((u)=><div key={u.Id} className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/50 p-3"><span>{u.Name} ({u.Role})</span><span className="text-slate-400">Claims: {u.ClaimsCount}</span></div>)}</CardContent></Card>;}

function AppShell(){
  const {user,loading}=useSession();
  const role = user?.role ?? "USER";
  const links=useMemo(()=>role==="ADMIN"?[{to:"/app",label:"Dashboard"},{to:"/app/admin/claims",label:"Claims"},{to:"/app/admin/users",label:"Users"}]:[{to:"/app",label:"Dashboard"},{to:"/app/new-claim",label:"New Claim"}],[role]);
  if(loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">Loading workspace...</div>;
  if(!getToken()||!user) return <Navigate to="/login" replace/>;
  return <div className="min-h-screen bg-slate-950 text-slate-100"><nav className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><div className="flex items-center gap-6"><h2 className="font-semibold">Insurance App</h2><div className="flex gap-2">{links.map((l)=><Link key={l.to} to={l.to} className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">{l.label}</Link>)}</div></div><Button size="sm" variant="ghost" onClick={()=>{localStorage.removeItem("token"); location.href="/";}}><LogOut size={14}/>Sign out</Button></div></nav><main className="mx-auto max-w-6xl space-y-4 px-4 py-6"><Routes><Route path="/" element={user.role==="ADMIN"?<AdminDashboard/>:<UserDashboard/>}/><Route path="/new-claim" element={<ClaimCreate/>}/><Route path="/claims/:id" element={<ClaimDetails/>}/><Route path="/admin/claims" element={<AdminClaims/>}/><Route path="/admin/users" element={<AdminUsers/>}/></Routes></main></div>;
}

function App(){const [sessionUser,setSessionUser]=useState<User|null>(null); return <BrowserRouter><Routes><Route path="/" element={getToken()?<Navigate to="/app" replace/>:<Landing/>}/><Route path="/login" element={getToken()?<Navigate to="/app" replace/>:<Login onLogin={setSessionUser}/>}/><Route path="/signup" element={getToken()?<Navigate to="/app" replace/>:<Signup/>}/><Route path="/app/*" element={<AppShell key={sessionUser?.id||0}/>}/></Routes></BrowserRouter>;}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
