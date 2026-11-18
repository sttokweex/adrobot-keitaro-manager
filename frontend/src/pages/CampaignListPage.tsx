import { useEffect, useMemo, useState } from "react";
import { CampaignGrid } from "../components/campaign-list/CampaignGrid";
import { CampaignListHeader } from "../components/campaign-list/CampaignListHeader";
import { CampaignListToolbar } from "../components/campaign-list/CampaignListToolbar";
import { CampaignPagination } from "../components/campaign-list/CampaignPagination";
import { api } from "../lib/api";
import type { Campaign, Notice } from "../types";

const PAGE_SIZE = 40;

export function CampaignListPage({
  onSelect,
  onCreate,
  notify,
}: {
  onSelect: (campaign: Campaign) => void;
  onCreate: () => void;
  notify: (notice: Notice) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    api<Campaign[]>("/api/campaigns")
      .then((data) => {
        if (active) setCampaigns(data);
      })
      .catch((error: unknown) => {
        if (active) {
          notify({ text: (error as Error).message, kind: "error" });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [notify]);

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return campaigns;

    return campaigns.filter(
      (campaign) =>
        campaign.name.toLocaleLowerCase().includes(normalizedQuery) ||
        String(campaign.id).includes(normalizedQuery),
    );
  }, [campaigns, query]);

  const pageCount = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE));
  const visibleCampaigns = filteredCampaigns.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [query]);

  return (
    <>
      <div className="breadcrumbs">
        <strong>Кампании</strong>
      </div>
      <CampaignListHeader onCreate={onCreate} />
      <CampaignListToolbar
        query={query}
        onQueryChange={setQuery}
        loading={loading}
        filteredCount={filteredCampaigns.length}
        totalCount={campaigns.length}
      />

      {loading ? (
        <div className="empty">
          <span>Загружаем кампании из Keitaro…</span>
        </div>
      ) : filteredCampaigns.length ? (
        <>
          <CampaignGrid campaigns={visibleCampaigns} onSelect={onSelect} />
          <CampaignPagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="empty small-empty">
          <strong>Кампании не найдены</strong>
          <span>Измените запрос или создайте кампанию.</span>
        </div>
      )}
    </>
  );
}
