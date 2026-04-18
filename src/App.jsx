import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import WorkstationList from './components/WorkstationList'
import SanitationOrderList from './components/SanitationOrderList'
import SanitationOrderDetail from './components/SanitationOrderDetail'
import WorkOrderList from './components/WorkOrderList'

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workstations" element={<WorkstationList />} />
          <Route path="/work-orders" element={<WorkOrderList />} />
          <Route path="/orders" element={<SanitationOrderList />} />
          <Route path="/orders/:id" element={<SanitationOrderDetail />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
