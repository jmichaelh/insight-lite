import jsPDF from "jspdf"

export async function generatePDF({ forecast }: { forecast: number[] }) {
  const doc = new jsPDF()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Insight Hunter Lite — Forecast", 14, 20)
  doc.setFontSize(12)
  forecast.forEach((val, i) => doc.text(`Q${i + 1}: $${val.toFixed(2)}`, 14, 40 + i * 10))
  const blob = doc.output("blob")

  const token = localStorage.getItem("jwt") || ""
  const res = await fetch("/api/pdf/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: blob
  })
  if (!res.ok) throw new Error("Upload failed")
  const { url } = await res.json()
  window.open(url, "_blank")
}
