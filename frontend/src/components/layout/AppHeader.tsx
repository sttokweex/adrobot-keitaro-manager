import { Icon } from "../Icon";

type Page = "campaigns" | "editor" | "create";

export function AppHeader({
  page,
  connected,
  onNavigate,
}: {
  page: Page;
  connected: boolean | null;
  onNavigate: (page: Page) => void;
}) {
  return (
    <header className="header">
      <a
        className="brand"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("campaigns");
        }}
      >
        <span className="brand-mark">A</span>AdRobot
      </a>
      <nav>
        <button
          className={page !== "create" ? "active" : ""}
          onClick={() => onNavigate("campaigns")}
        >
          Кампании
        </button>
        <button
          className={page === "create" ? "active" : ""}
          onClick={() => onNavigate("create")}
        >
          Создать кампанию
        </button>
      </nav>
      <div className="header-right">
        <span className={`connection ${connected ? "ok" : "off"}`}>
          <i />
          {connected ? "Keitaro подключён" : "Нет подключения"}
        </span>
        <a
          href="https://tlgk.host/admin"
          target="_blank"
          rel="noreferrer"
          className="kt-link"
        >
          Keitaro <Icon name="external" size={13} />
        </a>
      </div>
    </header>
  );
}
