import { Link, NavLink } from 'react-router-dom'
import { PropsWithChildren } from 'react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-slate-200' : 'hover:bg-slate-100'}`

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg">StockViz</Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>Home</NavLink>
            <NavLink to="/indicators" className={navLinkClass}>Indicators</NavLink>
            <NavLink to="/weights" className={navLinkClass}>Weights</NavLink>
            <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
          </nav>
          <div className="ml-auto text-sm text-slate-500">Frontend stub</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
