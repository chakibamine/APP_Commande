import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireStaff } from './components/Guards.tsx'
import { Layout } from './components/Layout.tsx'
import { AdminClientDetail, AdminClients } from './pages/AdminClients.tsx'
import { AdminCommandes } from './pages/AdminCommandes.tsx'
import { AdminDashboard } from './pages/AdminDashboard.tsx'
import { AdminParametres } from './pages/AdminParametres.tsx'
import { AdminProduits } from './pages/AdminProduits.tsx'
import { LoginAdmin } from './pages/AuthPages.tsx'
import { CommandeDetail } from './pages/CommandeDetail.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/connexion" element={<LoginAdmin />} />
      </Route>
      <Route path="/admin/connexion" element={<Navigate to="/connexion" replace />} />
      <Route element={<RequireStaff />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/commandes" element={<AdminCommandes />} />
          <Route path="/admin/commandes/:id" element={<CommandeDetail />} />
          <Route path="/admin/produits" element={<AdminProduits />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/clients/:id" element={<AdminClientDetail />} />
          <Route path="/admin/parametres" element={<AdminParametres />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
