import { FormEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Channel, MessageTemplate as MessageTemplateType } from "@/lib/types";

const CHANNELS: { value: Channel; label: string; icon: string }[] = [
  { value: "kakao", label: "카카오 알림톡", icon: "💬" },
  { value: "sms", label: "SMS", icon: "📱" },
  { value: "email", label: "이메일", icon: "📧" },
  { value: "webhook", label: "웹훅(디스코드/슬랙)", icon: "🔗" },
];

const VARIABLES = ["{이름}", "{경품명}", "{redeem_link}"];

export function MessageTemplate() {
  const { eventId } = useOutletContext<{ eventId: number }>();
  const [templates, setTemplates] = useState<MessageTemplateType[] | null>(null);
  const [channel, setChannel] = useState<Channel>("email");
  const [name, setName] = useState("");
  const [body, setBody] = useState("{이름}님, 축하드립니다! {경품명}에 당첨되셨어요.\n교환 링크: {redeem_link}");
  const [kakaoTemplateId, setKakaoTemplateId] = useState("");

  async function load() {
    setTemplates(await api.get<MessageTemplateType[]>(`/messages/template?event_id=${eventId}`));
  }

  useEffect(() => {
    load();
  }, [eventId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    await api.post("/messages/template", {
      event_id: eventId,
      channel,
      name,
      body,
      kakao_template_id: channel === "kakao" ? kakaoTemplateId || null : null,
    });
    setName("");
    setKakaoTemplateId("");
    await load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 font-medium text-slate-900">새 템플릿 작성</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">채널</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setChannel(c.value)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    channel === c.value ? "bg-brand-gradient text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="tpl-name">
              템플릿 이름
            </label>
            <input id="tpl-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {channel === "kakao" && (
            <div>
              <label className="label" htmlFor="tpl-kakao-id">
                카카오 알림톡 템플릿 ID
              </label>
              <input
                id="tpl-kakao-id"
                className="input"
                placeholder="Solapi 콘솔에서 사전 승인받은 템플릿 ID"
                value={kakaoTemplateId}
                onChange={(e) => setKakaoTemplateId(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                알림톡은 자유 텍스트 발송이 불가능해 아래 본문은 미리보기 용도로만 쓰이고, 실제 발송은 이 템플릿
                ID에 이름/경품명/교환링크 변수를 채워서 나갑니다.
              </p>
            </div>
          )}
          <div>
            <label className="label" htmlFor="tpl-body">
              본문
            </label>
            <textarea
              id="tpl-body"
              className="input min-h-[140px] resize-y font-mono text-xs"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBody((prev) => prev + v)}
                  className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              여기 직접 값을 입력하는 게 아니라, 발송 시점에 당첨자마다 자동으로 채워집니다. {"{경품명}"}과{" "}
              {"{redeem_link}"}는 "참여자" 탭에서 당첨자를 지정할 때 경품명을 입력해야 채워져요.
            </p>
          </div>
          <Button type="submit">템플릿 저장</Button>
        </form>
      </Card>

      <div className="space-y-4">
        <Card className="bg-brand-gradient-soft">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-600">미리보기</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {body.replace("{이름}", "홍길동").replace("{경품명}", "무선 이어폰").replace("{redeem_link}", "https://giftlink.example.com/redeem/abcd1234")}
          </p>
        </Card>

        {templates === null ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : templates.length === 0 ? (
          <EmptyState icon="✏️" title="저장된 템플릿이 없어요" />
        ) : (
          templates.map((t) => (
            <Card key={t.id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-slate-900">{t.name}</p>
                <span className="badge bg-slate-100 text-slate-500">{t.channel}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-500">{t.body}</p>
              {t.channel === "kakao" && (
                <p className="mt-2 text-xs text-slate-400">
                  템플릿 ID: {t.kakao_template_id ?? <span className="text-rose-500">미설정</span>}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
