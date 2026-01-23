import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";

import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";

import ProjectsList from "./pages/projects/ProjectsList";
import CreateProject from "./pages/projects/CreateProject";
import ProjectDetails from "./pages/projects/ProjectDetails";

import PacksPage from "./pages/pricing/PacksPage/PacksPage";
import PlansPage from "./pages/pricing/PlansPage/PlansPage";
import PaymentStartPage from "./pages/pricing/PaymentStartPage/PaymentStartPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/" element={ <RequireAuth><Navigate to="/dashboard" replace /></RequireAuth>}/>
          <Route path="/dashboard" element={ <RequireAuth><Dashboard /> </RequireAuth>}/>
          <Route path="/projects"  element={<RequireAuth><ProjectsList /></RequireAuth>}/>
          <Route path="/projects/new" element={ <RequireAuth><CreateProject /></RequireAuth> }/>
          <Route path="/projects/:id"element={<RequireAuth><ProjectDetails /></RequireAuth>}/>
          <Route path="/plans" element={<RequireAuth><PlansPage /></RequireAuth>}/>
          <Route path="/packs" element={<RequireAuth> <PacksPage /> </RequireAuth>}/>
          <Route path="/payment/start" element={ <RequireAuth> <PaymentStartPage /> </RequireAuth>}/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
