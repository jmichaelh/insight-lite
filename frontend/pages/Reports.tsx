import { useState } from "react"
import { generatePDF } from "../utils/pdf"


export default function Reports() {
  const [status, setStatus] = useState<string>("")
  async function create() {
    setStatus("Generating…")
    try {
      const forecast = [12000, 13500, 14200, 15000]
      await generatePDF({ forecast })
      setStatus("Report ready and opened in a new tab.")
    } catch {
      setStatus("Failed to generate report.")
    }
  }
  return (
    <section className="card">
      <h1>Reports</h1>
      <p className="muted">Create and share branded PDFs.</p>
      <button onClick={create}>Generate PDF</button>
      {status && <p>{status}</p>}
    </section>
  )
}
