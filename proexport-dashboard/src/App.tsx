import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard.tsx'
import ApproveLeads from './pages/ApproveLeads.tsx'
import ApprovedLeads from './pages/ApprovedLeads.tsx'
import Conversations from './pages/Conversations.tsx'
import Meetings from './pages/Meetings.tsx'
import Analytics from './pages/Analytics.tsx'
import ContentEngine from './pages/ContentEngine.tsx'
import Profile from './pages/Profile.tsx'

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
