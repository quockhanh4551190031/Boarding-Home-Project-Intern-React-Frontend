import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import HomePage from "./pages/HomePage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ChatPage from "./pages/ChatPage";
import LandlordHousesPage from "./pages/dashboard/LandlordHousesPage";

// Các trang tạm thời — sẽ thay dần ở các bước sau
function ForumPage() {
    return <div className="p-8">Diễn đàn (đang phát triển)</div>;
}
function ProfilePage() {
    return <div className="p-8">Hồ sơ cá nhân (đang phát triển)</div>;
}
function FavoritesPage() {
    return <div className="p-8">Phòng yêu thích (đang phát triển)</div>;
}
function LandlordRoomsPage() {
    return <div>Quản lý phòng trọ (đang phát triển)</div>;
}
function AdminStatsPage() {
    return <div>Thống kê hệ thống (đang phát triển)</div>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth pages — không có Navbar/Sidebar */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Các trang công khai + cần đăng nhập, dùng chung Navbar */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/rooms/:id" element={<RoomDetailPage />} />
                    <Route path="/forum" element={<ForumPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/favorites" element={<FavoritesPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                    </Route>
                </Route>

                {/* Khu vực Landlord — có Sidebar riêng */}
                <Route element={<RoleProtectedRoute allowedRoles={["LANDLORD"]} />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard/houses" element={<LandlordHousesPage />} />
                        <Route path="/dashboard/rooms" element={<LandlordRoomsPage />} />
                    </Route>
                </Route>

                {/* Khu vực Admin — cũng dùng DashboardLayout, Sidebar tự đổi link theo role */}
                <Route element={<RoleProtectedRoute allowedRoles={["ADMIN"]} />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard/admin/stats" element={<AdminStatsPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}