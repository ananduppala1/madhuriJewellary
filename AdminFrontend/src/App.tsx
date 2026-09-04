import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, RequireAuth } from "@/auth/AuthContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CollectionFormPage } from "@/pages/CollectionForm";
import { CollectionsPage } from "@/pages/Collections";
import { DashboardPage } from "@/pages/Dashboard";
import { GalleryPage } from "@/pages/Gallery";
import { LoginPage } from "@/pages/Login";
import { ProductFormPage } from "@/pages/ProductForm";
import { ProductsPage } from "@/pages/Products";
import { SiteSettingsPage } from "@/pages/SiteSettings";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductFormPage mode="create" />} />
          <Route path="/products/:id/edit" element={<ProductFormPage mode="edit" />} />

          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/new" element={<CollectionFormPage mode="create" />} />
          <Route path="/collections/:id/edit" element={<CollectionFormPage mode="edit" />} />

          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/site-settings" element={<SiteSettingsPage />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

function NotFound() {
  return (
    <div className="card flex flex-col items-center gap-3 px-5 py-16 text-center">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-2">
        That screen does not exist in the dashboard. Use the menu to get back on track.
      </p>
    </div>
  );
}
