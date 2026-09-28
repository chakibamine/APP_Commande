import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireRole } from './components/Guards.tsx'
import { Layout } from './components/Layout.tsx'
import { AdminClientDetail, AdminClients } from './pages/AdminClients.tsx'
import { AdminCommandes } from './pages/AdminCommandes.tsx'
import { AdminDashboard } from './pages/AdminDashboard.tsx'
import { AdminParametres } from './pages/AdminParametres.tsx'
import { AdminProduits } from './pages/AdminProduits.tsx'
import { LoginAdmin, LoginClient, RegisterClient } from './pages/AuthPages.tsx'
import { Catalogue } from './pages/Catalogue.tsx'
import { CommandeDetail } from './pages/CommandeDetail.tsx'
import { Commandes } from './pages/Commandes.tsx'
import { Profil } from './pages/Profil.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<GuestOnly />}>
          <Route path="/connexion" element={<LoginClient />} />
          <Route path="/inscription" element={<RegisterClient />} />
          <Route path="/admin/connexion" element={<LoginAdmin />} />
        </Route>
        <Route element={<RequireRole role="CLIENT" />}>
          <Route path="/" element={<Catalogue />} />
          <Route path="/commandes" element={<Commandes />} />
          <Route path="/commandes/:id" element={<CommandeDetail />} />
          <Route path="/profil" element={<Profil />} />
        </Route>
        <Route element={<RequireRole role="STAFF" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/commandes" element={<AdminCommandes />} />
          <Route path="/admin/commandes/:id" element={<CommandeDetail />} />
          <Route path="/admin/produits" element={<AdminProduits />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/clients/:id" element={<AdminClientDetail />} />
          <Route path="/admin/parametres" element={<AdminParametres />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
