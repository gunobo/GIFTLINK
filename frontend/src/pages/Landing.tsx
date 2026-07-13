import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LookupResult, PublicEvent } from "@/lib/types";

const STATUS_LABEL: Record<LookupResult["status"], { label: string; variant: "neutral" | "warning" | "success" }> = {
  pending: { label: "발급 대기중", variant: "neutral" },
  issued: { label: "교환 대기중", variant: "warning" },
  redeemed: { label: "교환 완료", variant: "success" },
  expired: { label: "기한 만료", variant: "neutral" },
};

export function Landing() {
  const [events, setEvents] = useState<PublicEvent[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<LookupResult[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<PublicEvent[]>("/public/events").then(setEvents);
  }, []);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ name: name.trim(), phone: phone.trim() });
      const data = await api.get<LookupResult[]>(`/public/lookup?${params.toString()}`);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-gradient-soft">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-lg">🎁</span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">GIFTLINK</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-slate-600">
          관리자 로그인
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20">
        <div className="mb-10 mt-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            내 경품 당첨, 여기서 바로 확인하세요
          </h1>
          <p className="mt-3 text-slate-500">이름과 연락처만 입력하면 당첨 여부와 교환 현황을 볼 수 있어요.</p>
        </div>

        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-card-hover">
          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label className="label" htmlFor="lookup-name">
                이름
              </label>
              <input
                id="lookup-name"
                className="input"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="lookup-phone">
                연락처
              </label>
              <input
                id="lookup-phone"
                className="input"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "조회 중..." : "내 당첨 확인하기"}
            </Button>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </form>
        </div>

        {searched && (
          <div className="mx-auto mt-6 max-w-md space-y-3">
            {results && results.length === 0 ? (
              <p className="text-center text-sm text-slate-400">
                입력하신 이름과 연락처로 등록된 당첨 내역이 없어요. 이름/연락처를 다시 확인해주세요.
              </p>
            ) : (
              results?.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
                  <div>
                    <p className="text-xs text-slate-400">{r.event_name}</p>
                    <p className="font-medium text-slate-900">{r.prize_name ?? "경품 정보 발급 대기중"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_LABEL[r.status].variant}>{STATUS_LABEL[r.status].label}</Badge>
                    {r.token && (
                      <Link to={`/redeem/${r.token}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                        보기 →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-16">
          <h2 className="mb-4 text-center text-lg font-semibold text-slate-800">진행 중인 이벤트</h2>
          {events === null ? (
            <p className="text-center text-sm text-slate-400">불러오는 중...</p>
          ) : events.length === 0 ? (
            <p className="text-center text-sm text-slate-400">현재 진행 중인 이벤트가 없어요.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {events.map((event) => (
                <div key={event.id} className="rounded-2xl bg-white p-5 shadow-card">
                  <Badge variant="success">진행중</Badge>
                  <p className="mt-2 font-medium text-slate-900">{event.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
