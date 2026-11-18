import { Icon } from "../Icon";
import type { Campaign } from "../../types";

export function CampaignGrid({
  campaigns,
  onSelect,
}: {
  campaigns: Campaign[];
  onSelect: (campaign: Campaign) => void;
}) {
  return (
    <div className="campaign-list">
      {campaigns.map((campaign) => (
        <button
          className="campaign-item"
          key={campaign.id}
          onClick={() => onSelect(campaign)}
        >
          <span className="campaign-item-icon">
            <Icon name="grid" size={17} />
          </span>
          <span className="campaign-item-main">
            <strong>{campaign.name}</strong>
            <small>Keitaro · ID {campaign.id}</small>
          </span>
          <span className="campaign-item-open">
            Открыть <Icon name="external" size={13} />
          </span>
        </button>
      ))}
    </div>
  );
}
