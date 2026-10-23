import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Modal from "./ui/Modal";
import { profileApi } from "../api/profileApi";
import { viewingApi } from "../api/viewingApi";
import { btnPrimary, btnSecondary, inputCls, labelCls, textareaCls } from "./ui/styles";
import { apiErrorMessage } from "../utils/apiError";
import { PHONE_RE, normalizePhone } from "../utils/profile";
import { MAX_DAYS_AHEAD, addDays, availableSlots, toDateInput } from "../utils/viewing";

interface Props {
    roomId: number;
    roomTitle: string;
    onClose: () => void;
    onCreated: () => void;
}

export default function ViewingRequestModal({ roomId, roomTitle, onClose, onCreated }: Props) {
    const { minDate, maxDate } = useMemo(() => {
        const now = new Date();
        return { minDate: toDateInput(now), maxDate: toDateInput(addDays(now, MAX_DAYS_AHEAD)) };
    }, []);

    // Hết khung giờ trong ngày hôm nay thì mặc định sang ngày mai
    const [date, setDate] = useState(() => {
        const now = new Date();
        return availableSlots(toDateInput(now)).length > 0 ? toDateInput(now) : toDateInput(addDays(now, 1));
    });
    const [time, setTime] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const slots = useMemo(() => availableSlots(date), [date]);
    const chosenTime = slots.includes(time) ? time : "";

    // Điền sẵn số điện thoại trong hồ sơ (nếu có) để người thuê khỏi gõ lại
    useEffect(() => {
        let cancelled = false;
        profileApi
            .getMine()
            .then((p) => {
                if (!cancelled && p.phone) setPhone((cur) => cur || p.phone || "");
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!date) {
            setError("Vui lòng chọn ngày xem phòng");
            return;
        }
        if (!chosenTime) {
            setError("Vui lòng chọn giờ xem phòng");
            return;
        }
        const phoneNorm = normalizePhone(phone);
        if (phoneNorm && !PHONE_RE.test(phoneNorm)) {
            setError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
            return;
        }

        setSaving(true);
        try {
            await viewingApi.create({ roomId, scheduledAt: `${date}T${chosenTime}:00`, message, contactPhone: phoneNorm });
            onCreated();
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err, "Gửi yêu cầu thất bại, thử lại sau"));
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Đặt lịch xem phòng"
            subtitle={roomTitle}
            icon="event_available"
            onClose={saving ? () => { } : onClose}
            footer={
                <>
                    {error && <p className="flex-1 text-sm text-error">{error}</p>}
                    <button type="button" onClick={onClose} disabled={saving} className={btnSecondary}>
                        Hủy
                    </button>
                    <button type="submit" form="viewing-form" disabled={saving} className={btnPrimary}>
                        {saving ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                </>
            }
        >
            <form id="viewing-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="viewing-date" className={labelCls}>
                            Ngày xem <span className="text-error">*</span>
                        </label>
                        <input
                            id="viewing-date"
                            type="date"
                            required
                            min={minDate}
                            max={maxDate}
                            className={inputCls}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="viewing-time" className={labelCls}>
                            Giờ xem <span className="text-error">*</span>
                        </label>
                        <select
                            id="viewing-time"
                            required
                            disabled={slots.length === 0}
                            className={inputCls}
                            value={chosenTime}
                            onChange={(e) => setTime(e.target.value)}
                        >
                            <option value="">{slots.length === 0 ? "Hết khung giờ trong ngày" : "Chọn giờ"}</option>
                            {slots.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className="-mt-2 text-xs text-on-surface-variant">
                    Nhận lịch từ 07:00 đến 20:30, đặt trước tối thiểu 1 giờ và trong vòng {MAX_DAYS_AHEAD} ngày tới.
                </p>

                <div>
                    <label htmlFor="viewing-phone" className={labelCls}>
                        Số điện thoại liên hệ <span className="font-normal text-on-surface-variant">(không bắt buộc)</span>
                    </label>
                    <input
                        id="viewing-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="0912345678"
                        className={`${inputCls} tabular-nums`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <p className="mt-1.5 text-xs text-on-surface-variant">Chỉ chủ trọ của phòng này nhìn thấy số này.</p>
                </div>

                <div>
                    <label htmlFor="viewing-message" className={labelCls}>
                        Ghi chú cho chủ trọ <span className="font-normal text-on-surface-variant">(không bắt buộc)</span>
                    </label>
                    <textarea
                        id="viewing-message"
                        rows={3}
                        maxLength={500}
                        className={textareaCls}
                        placeholder="Ví dụ: mình đi cùng 1 người bạn, cần xem cả khu vực để xe..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-on-surface-variant text-right mt-1 tabular-nums">{message.length}/500</p>
                </div>
            </form>
        </Modal>
    );
}