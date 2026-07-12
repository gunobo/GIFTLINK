export type EventStatus = "draft" | "active" | "closed";

export interface EventItem {
  id: number;
  name: string;
  status: EventStatus;
  created_at: string;
}

export interface Winner {
  id: number;
  event_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  discord_id: string | null;
  slack_webhook: string | null;
  source: "csv" | "manual";
  created_at: string;
}

export type Channel = "kakao" | "sms" | "email" | "webhook";

export interface MessageTemplate {
  id: number;
  event_id: number;
  channel: string;
  name: string;
  body: string;
  created_at: string;
}

export type MessageStatus = "pending" | "success" | "failed";

export interface MessageLog {
  id: number;
  winner_id: number;
  channel: Channel;
  status: MessageStatus;
  error_msg: string | null;
  sent_at: string;
}

export type RedemptionStatus = "issued" | "redeemed" | "expired";

export interface Redemption {
  id: number;
  winner_id: number;
  code: string;
  token: string;
  prize_name: string;
  status: RedemptionStatus;
  issued_at: string | null;
  redeemed_at: string | null;
  redeemed_by: string | null;
  expires_at: string | null;
}
