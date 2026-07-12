import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventItem, EventStatus } from "@/lib/types";

const STATUS_LABEL: Record<EventStatus, { label: string; variant: "neutral" | "success" | "warning" }> = {
  draft: { label: "준비중", variant: "neutral" },
  active: { label: "진행중", variant: "success" },
  closed: { label: "종료", variant: "warning" },
};

export function EventList() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setEvents(await api.get<EventItem[]>("/events"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post("/events", { name });
      setName("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">이벤트</h1>
          <p className="mt-1 text-sm text-slate-500">진행 중인 경품 이벤트를 관리하세요.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="card mb-6 flex items-end gap-3">
        <div className="flex-1">
          <label className="label" htmlFor="event-name">
            새 이벤트 이름
          </label>
          <input
            id="event-name"
            className="input"
            placeholder="예: 2026 봄맞이 동아리 이벤트"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={creating}>
          + 이벤트 생성
        </Button>
      </form>

      {events === null ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : events.length === 0 ? (
        <EmptyState icon="🎉" title="아직 이벤트가 없어요" description="위에서 첫 이벤트를 만들어보세요." />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="card flex items-center justify-between transition hover:shadow-card-hover"
            >
              <div>
                <p className="font-medium text-slate-900">{event.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  생성일 {new Date(event.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <Badge variant={STATUS_LABEL[event.status].variant}>{STATUS_LABEL[event.status].label}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
