import { OfferSearch } from "../OfferSearch";
import type { OfferChoice } from "../../types";
import type { CampaignFormField, CampaignFormState } from "./types";

export function CampaignBasicsFields({
  form,
  offer,
  onFieldChange,
  onOfferChange,
}: {
  form: CampaignFormState;
  offer: OfferChoice | null;
  onFieldChange: (name: CampaignFormField, value: string) => void;
  onOfferChange: (offer: OfferChoice | null) => void;
}) {
  return (
    <div className="form-grid">
      <label className="form-field wide">
        <span>Название кампании</span>
        <input
          required
          minLength={2}
          maxLength={120}
          value={form.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="Например, AU Beauty campaign"
        />
      </label>
      <label className="form-field">
        <span>GEO-код страны</span>
        <input
          required
          minLength={2}
          maxLength={2}
          value={form.country}
          onChange={(event) =>
            onFieldChange("country", event.target.value.toUpperCase().slice(0, 2))
          }
          placeholder="AU"
        />
        <small>ISO 3166-1 alpha-2</small>
      </label>
      <div className="form-field offer-field">
        <span>Оффер Keitaro</span>
        {offer ? (
          <div className="chosen-offer">
            <span>{offer.name}</span>
            <small>#{offer.id}</small>
            <button type="button" onClick={() => onOfferChange(null)}>
              ×
            </button>
          </div>
        ) : (
          <OfferSearch
            placeholder="Поиск по названию или ID"
            onSelect={onOfferChange}
          />
        )}
      </div>
    </div>
  );
}
