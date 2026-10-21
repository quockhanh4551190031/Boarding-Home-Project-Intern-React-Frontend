export interface GeoPoint {
    lat: number;
    lng: number;
}

function describe(err: GeolocationPositionError): string {
    switch (err.code) {
        case err.PERMISSION_DENIED:
            return "Bạn đã từ chối quyền định vị. Vào cài đặt trình duyệt để cấp lại quyền cho trang này.";
        case err.POSITION_UNAVAILABLE:
            return "Không xác định được vị trí. Kiểm tra GPS hoặc kết nối mạng của thiết bị.";
        case err.TIMEOUT:
            return "Lấy vị trí quá thời gian chờ, thử lại.";
        default:
            return "Không lấy được vị trí, thử lại sau.";
    }
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Lấy vị trí hiện tại. Làm tròn khoảng 10 m để không gửi tọa độ chính xác lên máy chủ. */
export function getPosition(): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Trình duyệt của bạn không hỗ trợ định vị"));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: round4(pos.coords.latitude), lng: round4(pos.coords.longitude) }),
            (err) => reject(new Error(describe(err))),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
    });
}