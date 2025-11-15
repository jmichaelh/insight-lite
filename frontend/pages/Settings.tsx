import { useState } from "react"

export default function Settings() {
  const [theme, setTheme] = useState("dark")
  const [installable, setInstallable] = useState(true)

  return (
    <section className="card">
      <h1>Settings</h1>
      <div className="form-grid">
        <label>
          Theme
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label>
          PWA install prompt
          <input type="checkbox" checked={installable} onChange={e => setInstallable(e.target.checked)} />
        </label>
      </div>
      <p className="muted">Changes are local-only in Lite.</p>
    </section>
  )
}
