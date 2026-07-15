import { FormEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { Redemption, RedemptionStatus, Winner } from "@/lib/types";

const STATUS_LABEL: Record<RedemptionStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  issued: { label: "발급됨", variant: "warning" },
  redeemed: { label: "교환완료", variant: "success" },
  expired: { label: "만료", variant: "neutral" },
};

export function RedemptionDashboard() {
  const { eventId } = useOutletContext<{ eventId: number }>();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [winnerId, setWinnerId] = useState<number | "">("");
  const [prizeName, setPrizeName] = useState("");
  const [giftUrl, setGiftUrl] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState("");
  const [editingGiftCode, setEditingGiftCode] = useState("");

  async function load() {
    const [r, w] = await Promise.all([
      api.get<Redemption[]>(`/redemption?event_id=${eventId}`),
      api.get<Winner[]>(`/winners?event_id=${eventId}&is_winner=true`),
    ]);
    setRedemptions(r);
    setWinners(w);
  }

  useEffect(() => {
    load();
  }, [eventId]);

  const issuedWinnerIds = new Set(redemptions.map((r) => r.winner_id));
  const unissuedWinners = winners.filter((w) => !issuedWinnerIds.has(w.id));

  async function handleIssue(e: FormEvent) {
    e.preventDefault();
    if (!winnerId || !prizeName.trim()) return;
    await api.post("/redemption/issue", {
      winner_id: winnerId,
      prize_name: prizeName,
      gift_url: giftUrl.trim() || null,
      gift_code: giftCode.trim() || null,
    });
    setWinnerId("");
    setPrizeName("");
    setGiftUrl("");
    setGiftCode("");
    await load();
  }

  function startEditGiftInfo(r: Redemption) {
    setEditingCode(r.code);
    setEditingUrl(r.gift_url ?? "");
    setEditingGiftCode(r.gift_code ?? "");
  }

  async function saveGiftInfo(code: string) {
    await api.patch(`/redemption/${code}/gift-info`, {
      gift_url: editingUrl.trim() || null,
      gift_code: editingGiftCode.trim() || null,
    });
    setEditingCode(null);
    await load();
  }

  async function handleUseCode(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      await api.patch(`/redemption/${code.trim()}/use`, { redeemed_by: "관리자" });
      setMessage({ type: "success", text: `${code} 코드 교환 처리 완료` });
      setCode("");
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "처리 실패" });
    }
  }

  const redeemedCount = redemptions.filter((r) => r.status === "redeemed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="발급된 코드" value={redemptions.length} />
        <StatTile label="교환 완료" value={redeemedCount} />
        <StatTile label="교환 대기" value={redemptions.length - redeemedCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-medium text-slate-900">교환 코드 발급</h2>
          <form onSubmit={handleIssue} className="space-y-3">
            <select className="input" value={winnerId} onChange={(e) => setWinnerId(Number(e.target.value))}>
              <option value="">당첨자 선택</option>
              {unissuedWinners.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <input className="input" placeholder="경품명" value={prizeName} onChange={(e) => setPrizeName(e.target.value)} />
            <input
              className="input"
              placeholder="선물 링크 (선택 · 카카오톡 선물하기 등)"
              value={giftUrl}
              onChange={(e) => setGiftUrl(e.target.value)}
            />
            <input
              className="input"
              placeholder="선물 코드 (선택 · 위 링크에서 입력할 코드)"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value)}
            />
            <Button type="submit" className="w-full">
              코드 발급
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium text-slate-900">오프라인 코드 직접 입력</h2>
          <form onSubmit={handleUseCode} className="space-y-3">
            <input
              className="input font-mono uppercase tracking-widest"
              placeholder="A3F9-7K2P"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" variant="secondary" className="w-full">
              교환 확정 처리
            </Button>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>{message.text}</p>
            )}
          </form>
        </Card>
      </div>

      {redemptions.length === 0 ? (
        <EmptyState icon="🎟️" title="발급된 교환 코드가 없어요" />
      ) : (
        <Card className="overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">코드</th>
                <th className="px-4 py-3 font-medium">경품명</th>
                <th className="px-4 py-3 font-medium">선물 링크/코드</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">처리자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono text-slate-700">{r.code}</td>
                  <td className="px-4 py-3 text-slate-600">{r.prize_name}</td>
                  <td className="px-4 py-3">
                    {editingCode === r.code ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          className="input h-8 w-28 py-1 text-xs"
                          placeholder="https://gift.kakao.com/..."
                          value={editingUrl}
                          onChange={(e) => setEditingUrl(e.target.value)}
                          autoFocus
                        />
                        <input
                          className="input h-8 w-20 py-1 text-xs"
                          placeholder="선물 코드"
                          value={editingGiftCode}
                          onChange={(e) => setEditingGiftCode(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => saveGiftInfo(r.code)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCode(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          취소
                        </button>
                      </div>
                    ) : r.gift_url || r.gift_code ? (
                      <div className="flex items-center gap-2">
                        <div className="text-xs">
                          {r.gift_url && (
                            <a
                              href={r.gift_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-[140px] truncate font-medium text-brand-600 hover:text-brand-700"
                            >
                              {r.gift_url}
                            </a>
                          )}
                          {r.gift_code && <span className="font-mono text-slate-500">{r.gift_code}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditGiftInfo(r)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          수정
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditGiftInfo(r)}
                        className="text-xs text-slate-400 underline hover:text-slate-600"
                      >
                        링크/코드 추가
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_LABEL[r.status].variant}>{STATUS_LABEL[r.status].label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.redeemed_by ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
