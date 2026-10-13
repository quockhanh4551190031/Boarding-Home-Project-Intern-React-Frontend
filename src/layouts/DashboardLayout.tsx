import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex flex-col lg:flex-row">
                <Sidebar />
                <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}