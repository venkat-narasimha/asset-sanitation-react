import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AssetGroups from './pages/AssetGroups.jsx'
import AssetGroupDetail from './pages/AssetGroupDetail.jsx'
import SanitationOrders from './pages/SanitationOrders.jsx'
import SanitationOrderDetail from './pages/SanitationOrderDetail.jsx'
import WorkOrders from './pages/WorkOrders.jsx'
import Items from './pages/Items.jsx'
import Boms from './pages/Boms.jsx'
import Assets from './pages/Assets.jsx'
import Workstations from './pages/Workstations.jsx'
import Profile from './pages/Profile.jsx'
import './styles/base.css'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/asset-sanitation">
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="asset-groups" element={<AssetGroups />} />
              <Route path="asset-groups/:id" element={<AssetGroupDetail />} />
              <Route path="orders" element={<SanitationOrders />} />
              <Route path="orders/:id" element={<SanitationOrderDetail />} />
              <Route path="work-orders" element={<WorkOrders />} />
              <Route path="items" element={<Items />} />
              <Route path="boms" element={<Boms />} />
              <Route path="assets" element={<Assets />} />
              <Route path="workstations" element={<Workstations />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
