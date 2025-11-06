import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"

const root = "insight-hunter-lite"
const folders = [
  "frontend/components",
  "frontend/styles",
  "frontend/utils",
  "backend/auth",
  "backend/forecast",
  "backend/summary",
  "backend/pdf",
  "shared",
  "scripts",
  ".github/workflows"
]

const files: Record<string, string> = {
  "frontend/index.html": `<!DOCTYPE html><html><head><title>Insight Hunter Lite</title><link rel="stylesheet" href="/styles/theme.css"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>`,
  "frontend/main.tsx": `import ReactDOM from 'react-dom'; import Dashboard from './components/Dashboard'; ReactDOM.render(<Dashboard />, document.getElementById('root'))`,
  "frontend/components/Chart.tsx": `export default function KPIChart({ data }) { return <div>{data.map((val, i) => <p key={i}>Q{i+1}: ${val}</p>)}</div> }`,
  "frontend/components/OnboardingModal.tsx": `import { useState } from 'react'; export default function OnboardingModal({ onComplete }) { const [step, setStep] = useState(0); const steps = ["Welcome", "Forecast your future", "Download reports", "Start"]; return <div className="modal"><div className="modal-content"><h2>{steps[step]}</h2><button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}>Next</button></div></div> }`,
  "frontend/styles/theme.css": `.modal{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center}.modal-content{background:#0f2f1f;color:#c0ffb0;padding:2rem;border-radius:12px;box-shadow:0 0 20px #00ff88}`,
  "frontend/utils/pdf.ts": `import jsPDF from 'jspdf'; export async function generatePDF({ forecast }) { const doc = new jsPDF(); doc.text("Insight Hunter Lite Forecast", 10, 10); forecast.forEach((val, i) => doc.text(\`Q\${i+1}: $\${val.toFixed(2)}\`, 10, 20 + i * 10)); const blob = doc.output("blob"); const token = localStorage.getItem("jwt"); const res = await fetch("/api/pdf/upload", { method: "POST", headers: { Authorization: \`Bearer \${token}\` }, body: blob }); const { url } = await res.json(); window.open(url, "_blank"); }`,
  "backend/index.ts": `import { handleLogin } from './auth/login'; import { handleForecast } from './forecast/forecast'; import { handleSummary } from './summary/summary'; import { handlePDFUpload } from './pdf/upload'; export default { async fetch(request, env) { const url = new URL(request.url); if (url.pathname === "/api/auth/login") return handleLogin(request, env); if (url.pathname === "/api/demo/forecast") return handleForecast(request, env); if (url.pathname === "/api/demo/summary") return handleSummary(request, env); if (url.pathname === "/api/pdf/upload") return handlePDFUpload(request, env); return new Response("Not found", { status: 404 }); } }`,
  "backend/auth/login.ts": `import { sign } from 'lucia/jwt'; export async function handleLogin(request, env) { const { email, password } = await request.json(); const userRaw = await env.USER_STORE.get(email); if (!userRaw) return new Response("User not found", { status: 404 }); const user = JSON.parse(userRaw); if (user.password !== password) return new Response("Invalid credentials", { status: 401 }); const token = await sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: "1h" }); return new Response(JSON.stringify({ token }), { headers: { "Content-Type": "application/json" } }); }`,
  "backend/forecast/forecast.ts": `export async function handleForecast(request, env) { const raw = await env.USER_STORE.get("raw_data"); const data = raw ? JSON.parse(raw) : { revenue: [12000, 13500, 14200] }; const forecast = data.revenue.map((val, i) => val * 1.05 ** (i + 1)); return new Response(JSON.stringify({ forecast }), { headers: { "Content-Type": "application/json" } }); }`,
  "backend/summary/summary.ts": `export async function handleSummary(request, env) { return new Response(JSON.stringify({ summary: "3 quarters of growth" }), { headers: { "Content-Type": "application/json" } }); }`,
  "backend/pdf/upload.ts": `export async function handlePDFUpload(request, env) { const token = request.headers.get("Authorization")?.replace("Bearer ", ""); const blob = await request.arrayBuffer(); const key = \`reports/\${Date.now()}.pdf\`; await env.R2_BUCKET.put(key, blob, { httpMetadata: { contentType: "application/pdf" } }); const url = \`https://r2.insighthunter.app/\${key}\`; return new Response(JSON.stringify({ url }), { headers: { "Content-Type": "application/json" } }); }`,
  "shared/types.ts": `export type ForecastData = { revenue: number[], expenses: number[], net: number[], labels: string[] }`,
  "scripts/setup.ts": `import { execSync } from "child_process"; const users = [{ email: "user@example.com", id: "user-123", password: "hunter123" }]; const forecast = { revenue: [12000, 13500, 14200], expenses: [8000, 8500, 8700], net: [4000, 5000, 5500], labels: ["Q1", "Q2", "Q3"] }; users.forEach(user => execSync(\`wrangler kv:key put \${user.email} '\${JSON.stringify(user)}' --namespace-id e6273860f3044173806606b6cab9d964\`)); execSync(\`wrangler kv:key put raw_data '\${JSON.stringify(forecast)}' --namespace-id e6273860f3044173806606b6cab9d964\`); console.log("✅ Preview users and forecast data seeded.");`,
  ".github/workflows/deploy.yml": `name: Deploy Insight Hunter Lite\non: push:\n  branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - run: npm install\n      - run: npm run setup\n      - run: wrangler deploy`,
  "wrangler.toml": `name = "insight-hunter-lite"\nmain = "backend/index.ts"\ncompatibility_date = "2024-09-01"\nkv_namespaces = [ { binding = "USER_STORE", id = "e6273860f3044173806606b6cab9d964" } ]\nr2_buckets = [ { binding = "R2_BUCKET", bucket_name = "ih-pdfs" } ]\n[vars]\nJWT_SECRET = "your-secret-key"\n[site]\nbucket = "./frontend"\nentry-point = "backend"\n[deploy]\ncustom_domain = "app.insighthunter.app"`,
  "README.md": `# Insight Hunter Lite\n\nCloudflare-native forecasting app with JWT auth, KPI charts, onboarding, and PDF export.\n\n## 🚀 Quick Start\n\n1. Clone repo\n2. Run \`npm install\`\n3. Run \`npm run setup\`\n4. Deploy with \`wrangler deploy\` and \`wrangler pages deploy ./frontend --project-name insight-hunter-lite\``
}

mkdirSync(root)
folders.forEach(f => mkdirSync(join(root, f), { recursive: true }))
Object.entries(files).forEach(([path, content]) => {
  writeFileSync(join(root, path), content)
})

console.log("✅ Insight Hunter Lite scaffold installed.")
