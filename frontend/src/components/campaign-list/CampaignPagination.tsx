export function CampaignPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="campaign-pagination">
      <button
        className="button plain"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        Назад
      </button>
      <span>
        Страница {page + 1} из {pageCount}
      </span>
      <button
        className="button plain"
        disabled={page + 1 >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Дальше
      </button>
    </div>
  );
}
