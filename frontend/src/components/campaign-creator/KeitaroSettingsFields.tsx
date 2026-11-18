import type { Resources } from "../../types";
import type { CampaignFormField, CampaignFormState } from "./types";

export function KeitaroSettingsFields({
  form,
  resources,
  loading,
  onFieldChange,
}: {
  form: CampaignFormState;
  resources: Resources;
  loading: boolean;
  onFieldChange: (name: CampaignFormField, value: string) => void;
}) {
  return (
    <div className="form-grid">
      <label className="form-field">
        <span>Домен</span>
        <select
          required
          value={form.domain_id}
          onChange={(event) => onFieldChange("domain_id", event.target.value)}
        >
          <option value="">
            {loading
              ? "Загружаем…"
              : resources.domains.length
                ? "Выберите домен"
                : "Нет доступных доменов"}
          </option>
          {resources.domains.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} · #{resource.id}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Группа</span>
        <select
          required
          value={form.group_id}
          onChange={(event) => onFieldChange("group_id", event.target.value)}
        >
          <option value="">
            {loading
              ? "Загружаем…"
              : resources.groups.length
                ? "Выберите группу"
                : "Нет доступных групп"}
          </option>
          {resources.groups.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} · #{resource.id}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field wide">
        <span>Источник трафика</span>
        <select
          required
          value={form.traffic_source_id}
          onChange={(event) => onFieldChange("traffic_source_id", event.target.value)}
        >
          <option value="">
            {loading
              ? "Загружаем…"
              : resources.traffic_sources.length
                ? "Выберите источник"
                : "Нет доступных источников"}
          </option>
          {resources.traffic_sources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} · #{resource.id}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
