import type { Campaign } from "../types";

export type AppPage = "campaigns" | "editor" | "create";

export type AppViewState = {
  page: AppPage;
  campaign: Campaign | null;
};

const STORAGE_KEY = "adrobot:view-state";
const EMPTY_VIEW: AppViewState = { page: "campaigns", campaign: null };

function isAppPage(value: unknown): value is AppPage {
  return value === "campaigns" || value === "editor" || value === "create";
}

function isCampaign(value: unknown): value is Campaign {
  if (typeof value !== "object" || value === null) return false;
  const campaign = value as Partial<Campaign>;
  return Number.isFinite(campaign.id) && typeof campaign.name === "string";
}

export function loadViewState(): AppViewState {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return EMPTY_VIEW;

    const value: unknown = JSON.parse(stored);
    if (typeof value !== "object" || value === null) return EMPTY_VIEW;

    const saved = value as Partial<AppViewState>;
    const campaign = isCampaign(saved.campaign) ? saved.campaign : null;
    if (!isAppPage(saved.page) || (saved.page === "editor" && !campaign)) {
      return EMPTY_VIEW;
    }

    return { page: saved.page, campaign };
  } catch {
    return EMPTY_VIEW;
  }
}

export function saveViewState(state: AppViewState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The app still works when browser storage is disabled or unavailable.
  }
}
