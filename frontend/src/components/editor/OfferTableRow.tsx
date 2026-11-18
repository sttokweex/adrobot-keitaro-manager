import { Icon } from "../Icon";
import type { Offer } from "../../types";

type OfferAction = "remove" | "bring-back" | "pin";

export function OfferTableRow({
  offer,
  busy,
  onMutate,
}: {
  offer: Offer;
  busy: boolean;
  onMutate: (action: OfferAction) => void;
}) {
  const removed = offer.status === "removed";
  const pending = offer.status === "pending_remove";

  return (
    <div
      className={`offer-row ${removed ? "removed" : ""} ${pending ? "pending-remove" : ""}`}
    >
      <div className="offer-name">
        <strong>{offer.name}</strong>
        <small>
          ID {offer.offer_id}
          {removed
            ? " · removed"
            : offer.status === "pending_add"
              ? " · новый"
              : ""}
        </small>
      </div>
      <div className="share-cell">
        {removed || pending ? (
          <span className="zero-share">
            {removed ? 0 : offer.current_share}%
          </span>
        ) : (
          <>
            <button
              className="share-value"
              onClick={() => onMutate("pin")}
              title={offer.pinned ? "Открепить вес" : "Закрепить вес"}
            >
              {offer.current_share}%
            </button>
            <button
              className={`pin ${offer.pinned ? "pinned" : ""}`}
              onClick={() => onMutate("pin")}
              aria-label={offer.pinned ? "Открепить вес" : "Закрепить вес"}
              title={offer.pinned ? "Вес закреплён" : "Закрепить вес"}
            >
              <Icon name="pin" size={13} />
            </button>
          </>
        )}
      </div>
      <div className="stats-cell">—</div>
      <div className="trends-cell">—</div>
      <div className="actions-cell">
        {removed ? (
          <button
            className="button bring-back"
            onClick={() => onMutate("bring-back")}
            disabled={busy}
          >
            <Icon name="back" size={13} />
            BRING BACK
          </button>
        ) : pending ? (
          <span className="pending-text">к удалению</span>
        ) : (
          <button
            className="button remove"
            onClick={() => onMutate("remove")}
            disabled={busy}
          >
            <Icon name="trash" size={13} />
            REMOVE
          </button>
        )}
      </div>
    </div>
  );
}
