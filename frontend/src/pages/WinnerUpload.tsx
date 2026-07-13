import { FormEvent, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Winner } from "@/lib/types";

export function WinnerUpload() {
  const { eventId } = useOutletContext<{ eventId: number }>();
  const [participants, setParticipants] = useState<Winner[] | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawCount, setDrawCount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setParticipants(await api.get<Winner[]>(`/winners?event_id=${eventId}`));
  }

  useEffect(() => {
    load();
  }, [eventId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.post("/winners", {
      event_id: eventId,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
    });
    setForm({ name: "", phone: "", email: "" });
    await load();
  }

  async function handleFileChange() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await api.upload<{ created: number; skipped: number; errors: string[] }>(
        `/winners/upload?event_id=${eventId}`,
        fd
      );
      setUploadResult(`${result.created}명 등록, ${result.skipped}건 건너뜀`);
      await load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSelectWinners() {
    if (selected.size === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.post("/winners/select-winners", { winner_ids: Array.from(selected) });
      setMessage({ type: "success", text: `${selected.size}명을 당첨자로 지정했어요.` });
      setSelected(new Set());
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleRandomDraw(e: FormEvent) {
    e.preventDefault();
    const count = Number(drawCount);
    if (!count || count < 1) return;
    setBusy(true);
    setMessage(null);
    try {
      const drawn = await api.post<Winner[]>("/winners/random-draw", { event_id: eventId, count });
      setMessage({ type: "success", text: `${drawn.map((w) => w.name).join(", ")} — ${drawn.length}명 추첨 완료` });
      setDrawCount("");
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "추첨에 실패했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const winnerCount = participants?.filter((p) => p.is_winner).length ?? 0;
  const nonWinners = participants?.filter((p) => !p.is_winner) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 font-medium text-slate-900">CSV 업로드</h2>
        <p className="mb-4 text-sm text-slate-400">
          컬럼명: <code className="rounded bg-slate-100 px-1.5 py-0.5">name, phone, email, discord_id, slack_webhook</code> ·
          업로드된 사람은 모두 참여자로 등록되고, 아래에서 당첨자를 선택합니다.
        </p>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="text-sm" disabled={uploading} />
          {uploading && <span className="text-sm text-slate-400">업로드 중...</span>}
          {uploadResult && <span className="text-sm text-emerald-600">{uploadResult}</span>}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium text-slate-900">직접 입력</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            className="input"
            placeholder="이름"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="전화번호"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="input"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Button type="submit">+ 추가</Button>
        </form>
      </Card>

      <Card className="bg-brand-gradient-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-medium text-slate-900">당첨자 선택</h2>
            <p className="mt-1 text-sm text-slate-500">
              전체 {participants?.length ?? 0}명 중 <span className="font-medium text-brand-700">{winnerCount}명</span> 당첨
              지정됨
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleRandomDraw} className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                className="input w-24"
                placeholder="인원"
                value={drawCount}
                onChange={(e) => setDrawCount(e.target.value)}
              />
              <Button type="submit" variant="secondary" disabled={busy || !drawCount}>
                🎲 무작위 추첨
              </Button>
            </form>
            <Button onClick={handleSelectWinners} disabled={busy || selected.size === 0}>
              선택 {selected.size}명 당첨자로 지정
            </Button>
          </div>
        </div>
        {message && (
          <p className={`mt-3 text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
            {message.text}
          </p>
        )}
      </Card>

      {participants === null ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : participants.length === 0 ? (
        <EmptyState icon="👥" title="아직 참여자가 없어요" description="CSV를 업로드하거나 직접 입력해보세요." />
      ) : (
        <Card className="overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={nonWinners.length > 0 && selected.size === nonWinners.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(nonWinners.map((p) => p.id)) : new Set())
                    }
                  />
                </th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">전화번호</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">입력 경로</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map((p) => (
                <tr key={p.id} className={p.is_winner ? "bg-brand-50/40" : undefined}>
                  <td className="px-4 py-3">
                    {!p.is_winner && (
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{p.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{p.source === "csv" ? "CSV" : "직접입력"}</td>
                  <td className="px-4 py-3">
                    {p.is_winner ? <Badge variant="success">🎉 당첨</Badge> : <Badge variant="neutral">참여자</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
