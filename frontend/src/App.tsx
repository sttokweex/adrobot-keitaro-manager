import { useEffect, useState } from "react";
import { AppFooter } from "./components/layout/AppFooter";
import { AppHeader } from "./components/layout/AppHeader";
import { NoticeBanner } from "./components/layout/NoticeBanner";
import { CampaignListPage } from "./pages/CampaignListPage";
import { CampaignCreator } from "./pages/CampaignCreator";
import { EditorPage } from "./pages/EditorPage";
import { api } from "./lib/api";
import type { Campaign, Notice } from "./types";

type Page = "campaigns" | "editor" | "create";

export default function App() {
  const [page, setPage] = useState<Page>("campaigns");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    api<{ keitaro_configured: boolean }>("/api/health")
      .then((health) => setConnected(health.keitaro_configured))
      .catch(() => setConnected(false));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(
      () => setNotice(null),
      notice.kind === "error" ? 6500 : 4000,
    );
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function openCampaign(selected: Campaign) {
    setCampaign(selected);
    setPage("editor");
  }

  return (
    <div className="app">
      <AppHeader
        page={page}
        connected={connected}
        onNavigate={setPage}
      />
      <main className="main">
        <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
        {page === "campaigns" ? (
          <CampaignListPage
            onSelect={openCampaign}
            onCreate={() => setPage("create")}
            notify={setNotice}
          />
        ) : page === "editor" && campaign ? (
          <EditorPage
            campaign={campaign}
            notify={setNotice}
            onBack={() => setPage("campaigns")}
            onCreate={() => setPage("create")}
          />
        ) : (
          <CampaignCreator
            notify={setNotice}
            onBack={() => setPage("campaigns")}
            onCreated={openCampaign}
          />
        )}
        <AppFooter />
      </main>
    </div>
  );
}
