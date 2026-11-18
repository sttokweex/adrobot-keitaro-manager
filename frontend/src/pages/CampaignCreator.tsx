import { type FormEvent, useEffect, useState } from "react";
import { CampaignBasicsFields } from "../components/campaign-creator/CampaignBasicsFields";
import { CreatedCampaignNotice } from "../components/campaign-creator/CreatedCampaignNotice";
import { FormSectionHeading } from "../components/campaign-creator/FormSectionHeading";
import { KeitaroSettingsFields } from "../components/campaign-creator/KeitaroSettingsFields";
import type { CampaignFormField, CampaignFormState } from "../components/campaign-creator/types";
import { api } from "../lib/api";
import type { Campaign, Notice, OfferChoice, Resources } from "../types";

const emptyResources: Resources = {
  domains: [],
  groups: [],
  traffic_sources: [],
};

const initialForm: CampaignFormState = {
  name: "",
  country: "",
  domain_id: "",
  group_id: "",
  traffic_source_id: "",
};

export function CampaignCreator({
  notify,
  onBack,
  onCreated,
}: {
  notify: (notice: Notice) => void;
  onBack: () => void;
  onCreated: (campaign: Campaign) => void;
}) {
  const [resources, setResources] = useState<Resources>(emptyResources);
  const [loading, setLoading] = useState(true);
  const [resourceError, setResourceError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offer, setOffer] = useState<OfferChoice | null>(null);
  const [created, setCreated] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignFormState>(initialForm);

  useEffect(() => {
    let active = true;
    api<Resources>("/api/resources")
      .then((data) => {
        if (active) setResources(data);
      })
      .catch((error: unknown) => {
        const message = (error as Error).message;
        if (!active) return;
        setResourceError(message);
        notify({ text: message, kind: "error" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [notify]);

  function updateField(name: CampaignFormField, value: string) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offer) {
      notify({ text: "Выберите оффер из Keitaro.", kind: "error" });
      return;
    }

    setSubmitting(true);
    setCreated(null);
    try {
      const result = await api<{
        campaign_id: number;
        campaign_name: string;
      }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          country: form.country.toUpperCase(),
          offer_id: offer.id,
          domain_id: Number(form.domain_id),
          group_id: Number(form.group_id),
          traffic_source_id: Number(form.traffic_source_id),
        }),
      });

      setCreated({ id: result.campaign_id, name: result.campaign_name });
      notify({ text: "Кампания и два потока созданы.", kind: "success" });
    } catch (error) {
      notify({ text: (error as Error).message, kind: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="breadcrumbs">
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
        >
          Кампании
        </a>
        <span>/</span>
        <strong>Создать кампанию</strong>
      </div>

      <div className="title-row">
        <div>
          <h1>Создать кампанию</h1>
          <p>Кампания с GEO-потоком и потоком выбранного оффера</p>
        </div>
      </div>

      <form className="creator-form" onSubmit={submit}>
        {resourceError && (
          <div className="resource-warning">
            Не удалось загрузить справочники Keitaro: {resourceError}
          </div>
        )}

        <FormSectionHeading
          step={1}
          title="Основные данные"
          description="Название кампании и параметры трафика"
        />
        <CampaignBasicsFields
          form={form}
          offer={offer}
          onFieldChange={updateField}
          onOfferChange={setOffer}
        />

        <FormSectionHeading
          step={2}
          title="Настройки Keitaro"
          description="Назначьте домен, группу и источник"
          className="section-second"
        />
        <KeitaroSettingsFields
          form={form}
          resources={resources}
          loading={loading}
          onFieldChange={updateField}
        />

        <div className="creator-bottom">
          <span>
            Будут созданы два потока: Google для выбранного GEO и выбранный
            оффер.
          </span>
          <button className="button primary" disabled={submitting || loading}>
            {submitting ? "Создаю…" : "Создать кампанию"}
          </button>
        </div>
      </form>

      {created && (
        <CreatedCampaignNotice
          campaign={created}
          onOpen={() => onCreated(created)}
        />
      )}
    </>
  );
}
