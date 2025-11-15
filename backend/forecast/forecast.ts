export async function handleForecast(request: Request, env: { USER_STORE: KVNamespace }) {
  const raw = await env.USER_STORE.get("raw_data")
  const data = raw ? JSON.parse(raw) : { revenue: [12000, 13500, 14200, 15000] }
  const forecast = data.revenue.map((val: number, i: number) => val * Math.pow(1.05, i + 1))
  return new Response(JSON.stringify({ forecast }), { headers: { "Content-Type": "application/json" } })
}
