import { useState } from "react";
import { OfferSearch } from "../OfferSearch";
import { OfferTableRow } from "./OfferTableRow";
import type { Offer, OfferChoice, Stream } from "../../types";

type OfferAction = "remove" | "bring-back" | "pin";
type StreamAction = "save" | "cancel";

export function StreamCard({
  stream,
  onAdd,
  onMutate,
  onAction,
  saving,
}: {
  stream: Stream;
  onAdd: (offer: OfferChoice) => Promise<boolean>;
  onMutate: (offer: Offer, action: OfferAction) => void;
  onAction: (action: StreamAction) => void;
  saving: string | null;
}) {
  const [selectedOffer, setSelectedOffer] = useState<OfferChoice | null>(null);
  const [adding, setAdding] = useState(false);
  const empty = stream.offers.length === 0;

  async function addSelectedOffer() {
    if (!selectedOffer) return;
    setAdding(true);
    if (await onAdd(selectedOffer)) setSelectedOffer(null);
    setAdding(false);
  }

  return (
    <section
      className={`stream ${stream.changed ? "changed" : ""} ${empty ? "stream-empty" : ""}`}
    >
      <div className="stream-heading">
        <div>
          <strong>Stream: {stream.name}</strong>
          <span className="stream-detail">
            (#{stream.id}) · {stream.type === "default" ? "default" : "regular"}
            {!stream.remote ? " · удалён в Keitaro" : ""}
          </span>
        </div>
        <div className="stream-heading-right">
          {stream.changed ? (
            <>
              <button
                className="button save"
                onClick={() => onAction("save")}
                disabled={saving === `${stream.id}:save`}
              >
                {saving === `${stream.id}:save` ? "Сохраняю…" : "PUSH TO KT"}
              </button>
              <button
                className="button cancel"
                onClick={() => onAction("cancel")}
                disabled={saving === `${stream.id}:cancel`}
              >
                CANCEL
              </button>
            </>
          ) : (
            <span className="click-info">stream_id {stream.id}</span>
          )}
        </div>
      </div>
      {empty ? (
        <div className="empty-stream-note">В этом потоке пока нет офферов</div>
      ) : (
        <>
          <div className="table-head">
            <span>Offer</span>
            <span>Share</span>
            <span>Stats</span>
            <span>Trends</span>
            <span>Actions</span>
          </div>
          <div className="offer-rows">
            {stream.offers.map((offer) => (
              <OfferTableRow
                key={offer.offer_id}
                offer={offer}
                busy={saving === `${stream.id}:${offer.offer_id}`}
                onMutate={(action) => onMutate(offer, action)}
              />
            ))}
          </div>
          <div className="add-row">
            <OfferSearch
              placeholder="Search offers by name or ID"
              onSelect={setSelectedOffer}
            />
            {selectedOffer ? (
              <>
                <span className="selected-offer">
                  {selectedOffer.name} <small>#{selectedOffer.id}</small>
                </span>
                <button
                  className="button primary add-offer-button"
                  disabled={adding}
                  onClick={() => void addSelectedOffer()}
                >
                  {adding ? "Добавляем…" : "Добавить"}
                </button>
                <button
                  className="button plain"
                  disabled={adding}
                  onClick={() => setSelectedOffer(null)}
                >
                  Отмена
                </button>
              </>
            ) : (
              <span className="add-hint">Выберите оффер, затем нажмите «Добавить»</span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
