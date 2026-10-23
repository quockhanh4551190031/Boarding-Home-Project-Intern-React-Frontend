import ViewingBoard from "../components/ViewingBoard";
import PageHeader from "../components/ui/PageHeader";
import { viewingApi } from "../api/viewingApi";
import type { TenantScope } from "../types/viewing";

export default function MyViewingsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <PageHeader
                eyebrow="Của bạn"
                note="Lịch hẹn"
                title="Lịch hẹn xem phòng"
                description="Theo dõi các yêu cầu xem phòng bạn đã gửi và phản hồi từ chủ trọ."
            />
            <ViewingBoard<TenantScope>
                perspective="tenant"
                scopes={[
                    { value: "upcoming", label: "Sắp tới" },
                    { value: "history", label: "Lịch sử" },
                ]}
                fetch={viewingApi.mine}
                empty={{
                    upcoming: {
                        title: "Bạn chưa có lịch hẹn sắp tới",
                        hint: 'Mở một phòng còn trống và bấm "Đặt lịch xem phòng" để hẹn chủ trọ.',
                        cta: { to: "/", label: "Tìm phòng" },
                    },
                    history: {
                        title: "Chưa có lịch sử",
                        hint: "Các lịch hẹn đã kết thúc, bị từ chối hoặc đã hủy sẽ hiện ở đây.",
                    },
                }}
            />
        </div>
    );
}