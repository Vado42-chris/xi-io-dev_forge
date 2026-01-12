import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { LandingPage } from './components/pages/LandingPage'
import { PricingPage } from './components/pages/PricingPage'
import { LoginPage } from './components/pages/LoginPage'
import { SignupPage } from './components/pages/SignupPage'
import { DashboardPage } from './components/pages/DashboardPage'
import { NotFoundPage } from './components/pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
