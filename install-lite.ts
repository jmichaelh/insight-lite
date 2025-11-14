import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"

const root = "insight-hunter-lite"
const folders = [
  "frontend/components",
  "frontend/styles",
  "frontend/utils",
  "frontend/icons",
  "backend/auth",
  "backend/forecast",
  "backend/summary",
  "backend/pdf",
  "shared",
  "scripts",
  ".github/workflows"
]

const files: Record<string, string> = {
  "frontend/index.html": `<!DOCTYPE html><html><head><title>Insight Hunter Lite</title><link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#00ff88"><link rel="stylesheet" href="/styles/theme.css"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script><script>if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js")}</script></body></html>`,
  "frontend/main.tsx": `import ReactDOM from 'react-dom'; import Dashboard from './components/Dashboard'; ReactDOM.render(<Dashboard />, document.getElementById('root'))`,
  "frontend/components/Dashboard.tsx": `import { useState, useEffect } from 'react'; import OnboardingModal from './OnboardingModal'; import KPIChart from './Chart'; import { generatePDF } from '../utils/pdf'; export default function Dashboard() { const [showModal, setShowModal] = useState(true); const [forecast, setForecast] = useState([]); useEffect(() => { const token = localStorage.getItem("jwt"); fetch("/api/demo/forecast", { headers: { Authorization: \`Bearer \${token}\` } }).then(res => res.json()).then(data => setForecast(data.forecast)) }, []); return (<>{showModal && <OnboardingModal onComplete={() => setShowModal(false)} />}<KPIChart data={forecast} /><button onClick={() => generatePDF({ forecast })}>Download PDF</button></>) }`,
  "frontend/components/Chart.tsx": `export default function KPIChart({ data }) { return <div>{data.map((val, i) => <p key={i}>Q{i+1}: $${val}</p>)}</div> }`,
  "frontend/components/OnboardingModal.tsx": `import { useState } from 'react'; export default function OnboardingModal({ onComplete }) { const [step, setStep] = useState(0); const steps = ["Welcome", "Forecast your future", "Download reports", "Start"]; return <div className="modal"><div className="modal-content"><h2>{steps[step]}</h2><button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}>Next</button></div></div> }`,
  "frontend/styles/theme.css": `.modal{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center}.modal-content{background:#0f2f1f;color:#c0ffb0;padding:2rem;border-radius:12px;box-shadow:0 0 20px #00ff88}`,
  "frontend/utils/pdf.ts": `import jsPDF from 'jspdf'; export async function generatePDF({ forecast }) { const doc = new jsPDF(); doc.text("Insight Hunter Lite Forecast", 10, 10); forecast.forEach((val, i) => doc.text(\`Q\${i+1}: $\${val.toFixed(2)}\`, 10, 20 + i * 10)); const blob = doc.output("blob"); const token = localStorage.getItem("jwt"); const res = await fetch("/api/pdf/upload", { method: "POST", headers: { Authorization: \`Bearer \${token}\` }, body: blob }); const { url } = await res.json(); window.open(url, "_blank"); }`,
  "frontend/manifest.json": `{"name":"Insight Hunter Lite","short_name":"IH Lite","start_url":"/","display":"standalone","background_color":"#0f2f1f","theme_color":"#00ff88","icons":[{"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png"}]}`,
  "frontend/sw.js": `self.addEventListener("install",e=>{e.waitUntil(caches.open("ih-lite-cache").then(c=>c.addAll(["/","/index.html","/main.tsx"])))})\nself.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})`,
  "backend/index.ts": `import { handleLogin } from './auth/login'; import { handleForecast } from './forecast/forecast'; import { handleSummary } from './summary/summary'; import { handlePDFUpload } from './pdf/upload'; export default { async fetch(request, env) { const url = new URL(request.url); if (url.pathname === "/api/auth/login") return handleLogin(request, env); if (url.pathname === "/api/demo/forecast") return handleForecast(request, env); if (url.pathname === "/api/demo/summary") return handleSummary(request, env); if (url.pathname === "/api/pdf/upload") return handlePDFUpload(request, env); return new Response("Not found", { status: 404 }); } }`,
  "backend/auth/login.ts": `export async function handleLogin(request, env) { const { email, password } = await request.json(); const userRaw = await env.USER_STORE.get(email); if (!userRaw) return new Response("User not found", { status: 404 }); const user = JSON.parse(userRaw); if (user.password !== password) return new Response("Invalid credentials", { status: 401 }); const token = btoa(\`\${user.id}:\${Date.now()}\`); return new Response(JSON.stringify({ token }), { headers: { "Content-Type": "application/json" } }); }`,
  "backend/forecast/forecast.ts": `export async function handleForecast(request, env) { const raw = await env.USER_STORE.get("raw_data"); const data = raw ? JSON.parse(raw) : { revenue: [12000, 13500, 14200] }; const forecast = data.revenue.map((val, i) => val * 1.05 ** (i + 1)); return new Response(JSON.stringify({ forecast }), { headers: { "Content-Type": "application/json" } }); }`,
  "backend/summary/summary.ts": `export async function handleSummary(request, env) { return new Response(JSON.stringify({ summary: "3 quarters of growth" }), { headers: { "Content-Type": "application/json" } }); }`,
  "backend/pdf/upload.ts": `export async function handlePDFUpload(request, env) { const blob = await request.arrayBuffer(); const key = \`reports/\${Date.now()}.pdf\`; await env.R2_BUCKET.put(key, blob, { httpMetadata: { contentType: "application/pdf" } }); const url = \`https://r2.insighthunter.app/\${key}\`; return new Response(JSON.stringify({ url }), { headers: { "Content-Type": "application/json" } }); }`,
  "shared/types.ts": `export type ForecastData = { revenue: number[], expenses: number[], net: number[], labels: string[] }`,
  "scripts/setup.ts": `import { execSync } from "child_process"; const users = [{ email: "user@example.com", id: "user-123", password: "hunter123" }]; const forecast = { revenue: [12000, 13500, 14200], expenses: [8000, 8500, 8700], net: [4000, 5000, 5500], labels: ["Q1", "Q2", "Q3"] }; users.forEach(user => execSync(\`wrangler kv:key put \${user.email} '\${JSON.stringify(user)}' --namespace-id e6273860f3044173806606b6cab9d964\`)); execSync(\`wrangler kv:key put raw_data '\${JSON.stringify(forecast)}' --namespace-id e6273860f3044173806606b6cab9d964\`); console.log("✅ Preview users and forecast data seeded.");`,
  ".github/workflows/deploy.yml": `name: Deploy Insight Hunter Lite\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - run: npm install\n      - run: npm run setup\n      - run: wrangler deploy\n      - run: wrangler pages deploy ./frontend --project-name insight-hunter-lite`,
  "wrangler.toml": `name = "insight-hunter-lite"\ntype = "javascript"\naccount_id = "your-cloudflare-account-id"\nworkers_dev = true\ncompatibility_date = "2025-
