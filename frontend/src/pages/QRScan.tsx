import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Redemption, RedemptionStatus } from "@/lib/types";

const STATUS_LABEL: Record<RedemptionStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  issued: { label: "발급됨 · 미교환", variant: "warning" },
  redeemed: { label: "이미 교환됨", variant: "success" },
  expired: { label: "만료", variant: "neutral" },
};

function extractToken(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/\/redeem\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : trimmed;
}

export function QRScan() {
  const [input, setInput] = useState("");
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRedemption(null);
    try {
      const token = extractToken(input);
      const result = await api.get<Redemption>(`/redemption/token/${token}`);
      setRedemption(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회에 실패했습니다.");
    }
  }

  async function handleConfirm() {
    if (!redemption) return;
    setConfirming(true);
    try {
      const result = await api.post<Redemption>(`/redemption/${redemption.code}/confirm`, {
        redeemed_by: "온라인(QR) 확정",
      });
      setRedemption(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "확정 처리에 실패했습니다.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <Link to="/events" className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <span aria-hidden>←</span> 이벤트로
        </Link>
      </header>

      <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">QR 스캔 처리</h1>
        <p className="mt-1 text-sm text-slate-500">현장에서 당첨자 QR을 스캔하거나 토큰을 붙여넣으세요.</p>
      </div>

      <form onSubmit={handleLookup} className="mb-6 flex gap-2">
        <input
          className="input"
          placeholder="QR 스캔 결과 또는 교환 링크 붙여넣기"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <Button type="submit">조회</Button>
      </form>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      {redemption && (
        <Card className="text-center">
          <Badge variant={STATUS_LABEL[redemption.status].variant}>{STATUS_LABEL[redemption.status].label}</Badge>
          <p className="mt-4 text-sm text-slate-400">경품</p>
          <p className="text-lg font-semibold text-slate-900">{redemption.prize_name}</p>
          <p className="mt-3 font-mono text-2xl tracking-widest text-brand-700">{redemption.code}</p>

          {redemption.status === "issued" ? (
            <Button onClick={handleConfirm} disabled={confirming} className="mt-6 w-full">
              {confirming ? "처리 중..." : "교환 확정 처리"}
            </Button>
          ) : (
            <p className="mt-6 text-sm text-slate-400">
              {redemption.redeemed_by && `처리자: ${redemption.redeemed_by}`}
            </p>
          )}
        </Card>
      )}
      </div>
    </div>
  );
}
