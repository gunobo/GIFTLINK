import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { EventItem, EventStatus } from "@/lib/types";

const TABS = [
  { to: "winners", label: "당첨자", icon: "👥" },
  { to: "templates", label: "메시지 템플릿", icon: "✏️" },
  { to: "send", label: "발송 결과", icon: "📤" },
  { to: "redemption", label: "경품 교환", icon: "🎟️" },
];

const STATUS_LABEL: Record<EventStatus, { label: string; variant: "neutral" | "success" | "warning" }> = {
  draft: { label: "준비중", variant: "neutral" },
  active: { label: "진행중", variant: "success" },
  closed: { label: "종료", variant: "warning" },
};

export function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    api.get<EventItem>(`/events/${eventId}`).then(setEvent);
  }, [eventId]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            <NavLink to="/events" className="hover:text-brand-600">
              이벤트
            </NavLink>{" "}
            / {event?.name ?? "..."}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{event?.name}</h1>
        </div>
        {event && <Badge variant={STATUS_LABEL[event.status].variant}>{STATUS_LABEL[event.status].label}</Badge>}
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                isActive ? "border-brand-600 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-700"
              }`
            }
          >
            <span>{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ eventId: Number(eventId) }} />
    </div>
  );
}
