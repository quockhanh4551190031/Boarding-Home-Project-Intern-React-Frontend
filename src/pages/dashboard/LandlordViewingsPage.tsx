import ViewingBoard from "../../components/ViewingBoard";
import PageHeader from "../../components/ui/PageHeader";
import { viewingApi } from "../../api/viewingApi";
import { refreshPendingViewings, useViewingStore } from "../../store/viewingStore";
import type { LandlordScope } from "../../types/viewing";

export default function LandlordViewingsPage() {
    const pending = useViewingStore((s) => s.pending);
    const setPending = useViewingStore((s) => s.setPending);

    return (
        <div>
            <PageHeader
                eyebrow="Quản lý"
                note="Chủ trọ"
                title="Yêu cầu xem phòng"
                description="Xác nhận hoặc từ chối yêu cầu xem phòng của người thuê. Người thuê sẽ nhận được thông báo qua tin nhắn."
            />
            <ViewingBoard<LandlordScope>
                perspective="landlord"
                scopes={[
                    { value: "pending", label: pending > 0 ? `Chờ xác nhận (${pending})` : "Chờ xác nhận" },
                    { value: "upcoming", label: "Sắp diễn ra" },
                    { value: "history", label: "Lịch sử" },
                ]}
                fetch={viewingApi.incoming}
                onLoaded={(scope, list) => {
                    if (scope === "pending") setPending(list.total);
                }}
                onChanged={refreshPendingViewings}
                empty={{
                    pending: {
                        title: "Không có yêu cầu nào đang chờ",
                        hint: "Khi có người thuê đặt lịch xem phòng, yêu cầu sẽ hiện ở đây.",
                    },
                    upcoming: {
                        title: "Chưa có lịch hẹn sắp diễn ra",
                        hint: "Các lịch bạn đã xác nhận sẽ hiện ở đây.",
                    },
                    history: {
                        title: "Chưa có lịch sử",
                        hint: "Các lịch hẹn đã diễn ra, bị từ chối hoặc đã hủy sẽ hiện ở đây.",
                    },
                }}
            />
        </div>
    );
}