import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { MessageLog, MessageTemplate, Winner } from "@/lib/types";

export function SendDashboard() {
  const { eventId } = useOutletContext<{ eventId: number }>();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [templateId, setTemplateId] = useState<number | "">("");
  const [sending, setSending] = useState(false);

  async function load() {
    const [w, t, l] = await Promise.all([
      api.get<Winner[]>(`/winners?event_id=${eventId}`),
      api.get<MessageTemplate[]>(`/messages/template?event_id=${eventId}`),
      api.get<MessageLog[]>(`/messages/logs?event_id=${eventId}`),
    ]);
    setWinners(w);
    setTemplates(t);
    setLogs(l);
  }

  useEffect(() => {
    load();
  }, [eventId]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSend() {
    const template = templates.find((t) => t.id === templateId);
    if (!template || selected.size === 0) return;
    setSending(true);
    try {
      await api.post(`/send/${template.channel}`, { winner_ids: Array.from(selected), template_id: template.id });
      setSelected(new Set());
      setTimeout(load, 800);
    } finally {
      setSending(false);
    }
  }

  const successCount = logs.filter((l) => l.status === "success").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="발송 대상" value={winners.length} />
        <StatTile label="성공" value={successCount} />
        <StatTile label="실패" value={failedCount} hint={failedCount > 0 ? "재발송 버튼으로 수동 재시도" : undefined} />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select className="input w-auto" value={templateId} onChange={(e) => setTemplateId(Number(e.target.value))}>
            <option value="">템플릿 선택</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.channel}] {t.name}
              </option>
            ))}
          </select>
          <Button onClick={handleSend} disabled={sending || !templateId || selected.size === 0}>
            {sending ? "발송 중..." : `선택 ${selected.size}명에게 발송`}
          </Button>
        </div>

        {winners.length === 0 ? (
          <EmptyState icon="👥" title="발송할 당첨자가 없어요" />
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {winners.map((w) => (
              <label key={w.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggle(w.id)} />
                <span className="text-sm text-slate-700">{w.name}</span>
                <span className="text-xs text-slate-400">{w.phone ?? w.email ?? "-"}</span>
              </label>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden !p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-medium text-slate-900">발송 로그</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-6">
            <EmptyState icon="📤" title="발송 기록이 없어요" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">채널</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">오류</th>
                <th className="px-4 py-3 font-medium">발송 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-slate-600">{log.channel}</td>
                  <td className="px-4 py-3">
                    <Badge variant={log.status === "success" ? "success" : log.status === "failed" ? "danger" : "neutral"}>
                      {log.status === "success" ? "성공" : log.status === "failed" ? "실패" : "대기"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{log.error_msg ?? "-"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(log.sent_at).toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
