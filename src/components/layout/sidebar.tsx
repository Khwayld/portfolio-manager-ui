import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Landmark,
  Building2,
  LineChart,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portfolios", label: "Portfolios", icon: Briefcase },
  { to: "/equities", label: "Equities", icon: TrendingUp },
  { to: "/deposits", label: "Deposits", icon: Landmark },
  { to: "/real-estate", label: "Real Estate", icon: Building2 },
  { to: "/market", label: "Market Data", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Briefcase className="h-5 w-5" />
          <span>Portfolio Manager</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
