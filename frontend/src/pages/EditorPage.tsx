import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { StreamCard } from "../components/editor/StreamCard";
import { api } from "../lib/api";
import type { Campaign, Notice, Offer, OfferChoice, Stream } from "../types";

type OfferAction = "remove" | "bring-back" | "pin";
type StreamAction = "save" | "cancel";

export function EditorPage({
  campaign,
  notify,
  onBack,
  onCreate,
}: {
  campaign: Campaign;
  notify: (notice: Notice) => void;
  onBack: () => void;
  onCreate: () => void;
}) {
  const campaignId = String(campaign.id);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function fetchStreams(id = campaign.id) {
    setLoading(true);
    try {
      const data = await api<{ streams: Stream[] }>(`/api/campaigns/${id}/streams`);
      setStreams(data.streams);
      setLoaded(true);
      if (!data.streams.length) {
        notify({ text: "В кампании нет потоков с офферами.", kind: "info" });
      }
    } catch (error) {
      notify({ text: (error as Error).message, kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchStreams();
    // Load streams when a campaign is opened; mutations call reload explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id]);

  async function reload() {
    await fetchStreams();
  }

  async function handleStreamAction(stream: Stream, action: StreamAction) {
    setSaving(`${stream.id}:${action}`);
    try {
      await api(`/api/campaigns/${campaignId}/streams/${stream.id}/${action}`, {
        method: "POST",
      });
      await reload();
      notify({
        text:
          action === "save"
            ? "Изменения сохранены в Keitaro."
            : "Изменения отменены.",
        kind: "success",
      });
    } catch (error) {
      notify({ text: (error as Error).message, kind: "error" });
    } finally {
      setSaving(null);
    }
  }

  async function handleOfferAction(
    stream: Stream,
    offer: Offer,
    action: OfferAction,
  ) {
    setSaving(`${stream.id}:${offer.offer_id}`);
    try {
      await api(
        `/api/campaigns/${campaignId}/streams/${stream.id}/offers/${offer.offer_id}/${action}`,
        { method: "POST" },
      );
      await reload();
    } catch (error) {
      notify({ text: (error as Error).message, kind: "error" });
    } finally {
      setSaving(null);
    }
  }

  async function addOffer(stream: Stream, offer: OfferChoice): Promise<boolean> {
    try {
      await api(`/api/campaigns/${campaignId}/streams/${stream.id}/offers`, {
        method: "POST",
        body: JSON.stringify({ offer_id: offer.id }),
      });
      await reload();
      notify({ text: `${offer.name} добавлен в черновик.`, kind: "success" });
      return true;
    } catch (error) {
      notify({ text: (error as Error).message, kind: "error" });
      return false;
    }
  }

  const activeOfferCount = streams.reduce(
    (count, stream) =>
      count +
      stream.offers.filter(
        (offer) => !["removed", "pending_remove"].includes(offer.status),
      ).length,
    0,
  );

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
        <a
          href={`https://tlgk.host/admin/#!/campaigns/${campaign.id}`}
          target="_blank"
          rel="noreferrer"
        >
          {campaign.name}
        </a>
        <span>/</span>
        <strong>Потоки</strong>
      </div>

      <div className="title-row">
        <div>
          <h1>Keitaro Streams</h1>
          <p>Управление офферами и распределением трафика</p>
        </div>
        <button className="button plain" onClick={onCreate}>
          <Icon name="plus" size={15} />
          Новая кампания
        </button>
      </div>

      <div className="toolbar">
        <div className="campaign-selected">
          <span>Кампания</span>
          <strong>{campaign.name}</strong>
          <small>ID {campaign.id}</small>
        </div>
        <button
          className="button primary"
          onClick={() => void fetchStreams()}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : <Icon name="refresh" size={14} />}
          FETCH STREAMS FROM KT
        </button>
        <a
          className="button plain view-link"
          href={`https://tlgk.host/admin/#!/campaigns/${campaign.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="external" size={14} /> VIEW IN KT
        </a>
      </div>

      {loaded && streams.length > 0 && (
        <div className="sync-line">
          <span>
            <i />
            Загружено из Keitaro
          </span>
          <span>
            {streams.length} потоков · {activeOfferCount} активных офферов
          </span>
        </div>
      )}

      {!loaded && loading && (
        <div className="empty">
          <Icon name="layers" size={24} />
          <strong>Загружаем потоки кампании</strong>
          <span>Подключаемся к Keitaro.</span>
        </div>
      )}
      {loaded && streams.length === 0 && (
        <div className="empty small-empty">
          <strong>В кампании пока нет потоков</strong>
          <span>Нажмите Fetch Streams From KT, чтобы обновить данные.</span>
        </div>
      )}

      <div className="stream-list">
        {streams.map((stream) => (
          <StreamCard
            key={stream.id}
            stream={stream}
            onAdd={(offer) => addOffer(stream, offer)}
            onMutate={(offer, action) =>
              void handleOfferAction(stream, offer, action)
            }
            onAction={(action) => void handleStreamAction(stream, action)}
            saving={saving}
          />
        ))}
      </div>
    </>
  );
}
