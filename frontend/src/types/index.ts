export type Resource = { id: number; name: string };
export type Campaign = { id: number; name: string };
export type Offer = {
  campaign_id: number;
  stream_id: number;
  offer_id: number;
  name: string;
  current_share: number;
  remote_share: number | null;
  status: "active" | "pending_add" | "pending_remove" | "modified" | "removed";
  pinned: number;
};
export type Stream = {
  id: number;
  name: string;
  type: string;
  remote: boolean;
  changed: boolean;
  offers: Offer[];
};
export type Notice = { text: string; kind: "success" | "error" | "info" } | null;
export type OfferChoice = { id: number; name: string };
export type Resources = {
  domains: Resource[];
  groups: Resource[];
  traffic_sources: Resource[];
};
