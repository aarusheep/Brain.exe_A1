import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ApproveLeads from './pages/ApproveLeads'
import ApprovedLeads from './pages/ApprovedLeads'
import Conversations from './pages/Conversations'
import Meetings from './pages/Meetings'
import Analytics from './pages/Analytics'
import ContentEngine from './pages/ContentEngine'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="approve-leads" element={<ApproveLeads />} />
          <Route path="approved-leads" element={<ApprovedLeads />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="content-engine" element={<ContentEngine />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
