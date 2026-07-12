import { FormEvent, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "새 비밀번호는 8자 이상이어야 합니다." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "새 비밀번호가 서로 일치하지 않습니다." });
      return;
    }

    setSubmitting(true);
    try {
      await api.patch("/auth/password", { current_password: currentPassword, new_password: newPassword });
      setMessage({ type: "success", text: "비밀번호가 변경되었습니다." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "변경에 실패했습니다." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">설정</h1>
        <p className="mt-1 text-sm text-slate-500">관리자 계정 비밀번호를 변경합니다.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="current-password">
              현재 비밀번호
            </label>
            <input
              id="current-password"
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="new-password">
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">
              새 비밀번호 확인
            </label>
            <input
              id="confirm-password"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {message.text}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
