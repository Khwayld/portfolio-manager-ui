import { createBrowserRouter } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import DashboardPage from "@/pages/dashboard"
import PortfolioPage from "@/pages/portfolio"
import HoldingsPage from "@/pages/holdings"
import EquitiesPage from "@/pages/equities"
import DepositsPage from "@/pages/deposits"
import RealEstatePage from "@/pages/real-estate"
import MarketDataPage from "@/pages/market-data"
import SettingsPage from "@/pages/settings"
import LoginPage from "@/pages/auth/login"
import SignUpPage from "@/pages/auth/signup"

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/portfolios", element: <PortfolioPage /> },
      { path: "/portfolios/:id", element: <HoldingsPage /> },
      { path: "/equities", element: <EquitiesPage /> },
      { path: "/deposits", element: <DepositsPage /> },
      { path: "/real-estate", element: <RealEstatePage /> },
      { path: "/market", element: <MarketDataPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignUpPage /> },
])
