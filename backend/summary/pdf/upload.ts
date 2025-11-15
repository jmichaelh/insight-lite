export async function handlePDFUpload(request: Request, env: { R2_BUCKET: R2Bucket }) {
  const blob = await request.arrayBuffer()
  const key = `reports/${Date.now()}.pdf`
  await env.R2_BUCKET.put(key, blob, { httpMetadata: { contentType: "application/pdf" } })
  const url = `https://r2.insighthunter.app/${key}` // replace with your public R2 URL/CF route
  return new Response(JSON.stringify({ url }), { headers: { "Content-Type": "application/json" } })
}
