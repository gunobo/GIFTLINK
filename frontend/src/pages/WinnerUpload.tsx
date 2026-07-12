import { FormEvent, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Winner } from "@/lib/types";

export function WinnerUpload() {
  const { eventId } = useOutletContext<{ eventId: number }>();
  const [winners, setWinners] = useState<Winner[] | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setWinners(await api.get<Winner[]>(`/winners?event_id=${eventId}`));
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

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 font-medium text-slate-900">CSV 업로드</h2>
        <p className="mb-4 text-sm text-slate-400">
          컬럼명: <code className="rounded bg-slate-100 px-1.5 py-0.5">name, phone, email, discord_id, slack_webhook</code>
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

      {winners === null ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : winners.length === 0 ? (
        <EmptyState icon="👥" title="아직 당첨자가 없어요" description="CSV를 업로드하거나 직접 입력해보세요." />
      ) : (
        <Card className="overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">전화번호</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">입력 경로</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {winners.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{w.name}</td>
                  <td className="px-4 py-3 text-slate-500">{w.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{w.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{w.source === "csv" ? "CSV" : "직접입력"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
