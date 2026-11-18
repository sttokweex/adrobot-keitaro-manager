import { Icon } from "../Icon";

export function CampaignListHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="title-row campaign-list-title">
      <div>
        <h1>Кампании</h1>
        <p>Выберите кампанию, чтобы открыть и обновить её потоки</p>
      </div>
      <button className="button primary" onClick={onCreate}>
        <Icon name="plus" size={15} /> Новая кампания
      </button>
    </div>
  );
}
