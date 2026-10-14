const MUTE_KEY = "chat_sound_muted";
let audioCtx: AudioContext | null = null;

export function isSoundMuted(): boolean {
    try {
        return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
        return false;
    }
}

export function setSoundMuted(muted: boolean) {
    try {
        localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
        // trình duyệt chặn localStorage: bỏ qua
    }
}

export function playNotificationSound() {
    if (isSoundMuted()) return;
    try {
        const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
        if (!Ctor) return;
        audioCtx = audioCtx ?? new Ctor();
        if (audioCtx.state === "suspended") void audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;

        const t = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
    } catch {
        // trình duyệt chặn phát âm thanh: bỏ qua
    }
}