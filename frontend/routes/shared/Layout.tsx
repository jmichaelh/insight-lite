import { NavLink, Outlet, useNavigate } from "react-router-dom"

export default function Layout() {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem("jwt")
    navigate("/login")
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/icons/icon-192.png" alt="IH Lite" className="brand-icon" />
          <span>Insight Hunter Lite</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/forecast">Forecast</NavLink>
          <NavLink to="/summary">Summary</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <button className="logout" onClick={logout}>Logout</button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
