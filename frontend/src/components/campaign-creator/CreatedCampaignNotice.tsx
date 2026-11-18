import type { Campaign } from "../../types";

export function CreatedCampaignNotice({
  campaign,
  onOpen,
}: {
  campaign: Campaign;
  onOpen: () => void;
}) {
  return (
    <div className="created">
      <span>
        <b>Кампания создана</b>
        <small>
          {campaign.name} · ID {campaign.id}
        </small>
      </span>
      <button className="button plain" onClick={onOpen}>
        Перейти в кампанию
      </button>
    </div>
  );
}
