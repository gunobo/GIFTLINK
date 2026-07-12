import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { EventList } from "@/pages/EventList";
import { EventDetail } from "@/pages/EventDetail";
import { WinnerUpload } from "@/pages/WinnerUpload";
import { MessageTemplate } from "@/pages/MessageTemplate";
import { SendDashboard } from "@/pages/SendDashboard";
import { RedemptionDashboard } from "@/pages/RedemptionDashboard";
import { QRScan } from "@/pages/QRScan";
import { PublicRedeem } from "@/pages/PublicRedeem";
import { Settings } from "@/pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/redeem/:token" element={<PublicRedeem />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/scan" element={<QRScan />} />

          <Route element={<Layout />}>
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:eventId" element={<EventDetail />}>
              <Route index element={<Navigate to="winners" replace />} />
              <Route path="winners" element={<WinnerUpload />} />
              <Route path="templates" element={<MessageTemplate />} />
              <Route path="send" element={<SendDashboard />} />
              <Route path="redemption" element={<RedemptionDashboard />} />
            </Route>
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </AuthProvider>
  );
}
