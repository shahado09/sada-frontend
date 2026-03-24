import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import RequireAdmin from "./auth/RequireAdmin";

import MainLayout from "./layouts/MainLayout";

import Login from "./pages/login/Login";
import Signup from "./pages/Signup/Signup";
import ForgotPasswordPage from "./pages/login/ForgotPasswordPage";
import GoogleSuccessPage from "./pages/GoogleSuccess/GoogleSuccessPage";
import VerifyEmailPage from "./pages/VerifyEmail/VerifyEmailPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import Dashboard from "./pages/Dashboard/Dashboard";

import ProjectsList from "./pages/projects/ProjectsList";
import CreateProject from "./pages/projects/CreateProject";
import ProjectDetails from "./pages/projects/ProjectDetails";

import PlansPage from "./pages/pricing/PlansPage/PlansPage";
import PacksPage from "./pages/pricing/PacksPage/PacksPage";
import PaymentStartPage from "./pages/pricing/PaymentStartPage/PaymentStartPage";
import PaymentFormPage from "./pages/pricing/PaymentFormPage/PaymentFormPage";
import PaymentStatusPage from "./pages/pricing/PaymentStatusPage/PaymentStatusPage";

import AdminLayout from "./pages/admin/AdminLayout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import AdminPayments from "./pages/admin/AdminPayments/AdminPayments";
import AdminPlans from "./pages/admin/AdminPlans/AdminPlans";
import AdminPacks from "./pages/admin/AdminPacks/AdminPacks";
import AdminUsers from "./pages/admin/AdminUsers/AdminUsers";
import AdminPrompts from "./pages/admin/AdminPrompts/AdminPrompts";
import AdminLedger from "./pages/admin/AdminLedger/AdminLedger";
import AdminPricing from "./pages/admin/AdminPricing/AdminPricing";

import LandingPage from "./pages/Landing/LandingPage";
import PolicyPage from "./pages/Policy/PolicyPage";

import "./styles/adminControls.css";
import GeneratePage from "./pages/Generate/GeneratePage/GeneratePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/google/success" element={<GoogleSuccessPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/policy" element={<PolicyPage />} />

          {/* Plans & Packs — public (view only) */}
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/packs" element={<PacksPage />} />

          {/* ── Protected routes ── */}
          <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/new" element={<CreateProject />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />

            {/* Payment — protected */}
            <Route path="/payment/start" element={<PaymentStartPage />} />
            <Route path="/payment/:id" element={<PaymentFormPage />} />
            <Route path="/payment/request/:id" element={<PaymentStatusPage />} />

            <Route path="/generate/fashion" element={<GeneratePage category="fashion" title="Cloth AI" subtitle="Generate fashion visuals with templates or pro prompts." />} />
            <Route path="/generate/product" element={<GeneratePage category="product" title="Product AI" subtitle="Create premium product shots & ads." />} />
            <Route path="/generate/creator" element={<GeneratePage category="creator" title="Creator AI" subtitle="Content for creators: posters, edits, reels." />} />
          </Route>

          {/* ── Admin routes ── */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="packs" element={<AdminPacks />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="prompts" element={<AdminPrompts />} />
            <Route path="ledger" element={<AdminLedger />} />
            <Route path="pricing" element={<AdminPricing />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}