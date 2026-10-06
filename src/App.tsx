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
import LandlordHousesPage from "./pages/dashboard/LandLordHousesPage";
import LandlordRoomsPage from "./pages/dashboard/LandlordRoomsPage";
import AdminUsersPage from "./pages/dashboard/AdminUsersPage";
import AdminPostsPage from "./pages/dashboard/AdminPostsPage";
import AdminReportsPage from "./pages/dashboard/AdminReportsPage";
import AdminStatsPage from "./pages/dashboard/AdminStatsPage";
import ProfilePage from "./pages/ProfilePage";
import FavoritesPage from "./pages/FavoritesPage";
import ForumPage from "./pages/ForumPage";
import PostDetailPage from "./pages/PostDetailPage";
import ChatbotWidget from "./components/ChatbotWidget";
import HouseDetailPage from "./pages/HouseDetailPage";

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
                    <Route path="/forum/:id" element={<PostDetailPage />} />
                    <Route path="/houses/:id" element={<HouseDetailPage />} />

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
                        <Route path="/dashboard/admin/users" element={<AdminUsersPage />} />
                        <Route path="/dashboard/admin/posts" element={<AdminPostsPage />} />
                        <Route path="/dashboard/admin/reports" element={<AdminReportsPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ChatbotWidget />
        </BrowserRouter>
    );
}