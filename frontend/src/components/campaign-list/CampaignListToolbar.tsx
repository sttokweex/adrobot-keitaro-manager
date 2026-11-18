import { Icon } from "../Icon";

export function CampaignListToolbar({
  query,
  onQueryChange,
  loading,
  filteredCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  loading: boolean;
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="campaign-list-toolbar">
      <div className="search-box">
        <Icon name="search" size={15} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск по названию или ID"
          aria-label="Поиск кампаний"
        />
      </div>
      <span>
        {loading
          ? "Загрузка…"
          : `${filteredCount} из ${totalCount} кампаний`}
      </span>
    </div>
  );
}
