import { useEffect, useState } from "react"
import { generatePDF } from "../utils/pdf"

type ForecastResponse = { forecast: number[] }

export default function Dashboard() {
  const [data, setData] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("jwt") || ""
    fetch("/api/demo/forecast", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Failed to load forecast")))
      .then((json: ForecastResponse) => setData(json.forecast))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="card">
      <h1>Dashboard</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <>
          <ul className="kpi">
            {data.map((v, i) => <li key={i}><strong>Q{i + 1}:</strong> ${v.toFixed(2)}</li>)}
          </ul>
          <div className="actions">
            <button onClick={() => generatePDF({ forecast: data })}>Download PDF</button>
          </div>
        </>
      )}
    </section>
  )
}
