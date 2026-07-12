import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";

interface RedeemPage {
  code: string;
  prize_name: string;
  status: "issued" | "redeemed" | "expired";
  qr_data_url: string;
  expires_at: string | null;
}

const STATUS_COPY: Record<RedeemPage["status"], { title: string; tone: string }> = {
  issued: { title: "아래 코드를 현장에서 제시해주세요", tone: "text-brand-700" },
  redeemed: { title: "이미 교환이 완료된 경품이에요", tone: "text-emerald-600" },
  expired: { title: "교환 기한이 지났어요", tone: "text-slate-400" },
};

export function PublicRedeem() {
  const { token } = useParams();
  const [data, setData] = useState<RedeemPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get<RedeemPage>(`/redeem/${token}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "링크를 불러올 수 없습니다."));
  }, [token]);

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-gradient-soft px-4">
        <p className="text-center text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-gradient-soft px-4">
        <p className="text-sm text-slate-400">불러오는 중...</p>
      </div>
    );
  }

  const isRedeemed = data.status !== "issued";

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient-soft px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">🎉</div>
          <p className="text-sm font-medium text-brand-600">당첨을 축하드립니다!</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{data.prize_name}</h1>
        </div>

        <div className="ticket relative overflow-hidden rounded-2xl bg-white shadow-card-hover">
          <div className="bg-brand-gradient px-6 py-5 text-center text-white">
            <p className={`text-sm font-medium ${isRedeemed ? "text-white/90" : "text-white"}`}>
              {STATUS_COPY[data.status].title}
            </p>
          </div>

          <div className="ticket-notch" />

          <div className={`flex flex-col items-center gap-5 px-6 py-8 ${isRedeemed ? "opacity-50" : ""}`}>
            <img src={data.qr_data_url} alt="교환 QR 코드" className="h-40 w-40 rounded-xl ring-1 ring-slate-100" />

            <button
              onClick={handleCopy}
              className="rounded-xl border border-dashed border-brand-300 bg-brand-50 px-5 py-3 font-mono text-2xl tracking-[0.2em] text-brand-700 transition hover:bg-brand-100"
            >
              {data.code}
            </button>
            <p className="-mt-3 text-xs text-slate-400">{copied ? "코드가 복사되었어요" : "탭하여 코드 복사"}</p>

            {data.expires_at && (
              <p className="text-xs text-slate-400">교환 기한 {new Date(data.expires_at).toLocaleDateString("ko-KR")}까지</p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          {isRedeemed ? "이미 처리된 교환 코드입니다." : "현장 관리자에게 QR 또는 코드를 보여주세요."}
        </p>
      </div>

      <style>{`
        .ticket-notch {
          position: relative;
          height: 0;
        }
        .ticket-notch::before,
        .ticket-notch::after {
          content: "";
          position: absolute;
          top: -12px;
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: #f5f3ff;
        }
        .ticket-notch::before { left: -12px; }
        .ticket-notch::after { right: -12px; }
      `}</style>
    </div>
  );
}
