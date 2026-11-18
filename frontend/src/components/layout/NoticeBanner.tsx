import { Icon } from "../Icon";
import type { Notice } from "../../types";

export function NoticeBanner({
  notice,
  onDismiss,
}: {
  notice: Notice;
  onDismiss: () => void;
}) {
  if (!notice) return null;

  return (
    <div className={`notice ${notice.kind}`} role="status">
      <span>{notice.text}</span>
      <button onClick={onDismiss} aria-label="Закрыть уведомление">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
