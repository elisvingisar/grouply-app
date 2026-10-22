export type EventItem = {
    id: number;
    title?: string;
    description?: string | null;
    dateTime?: string | null;
    location?: string | null;
    participantCount?: number | null;
    imageUrl?: string | null;
};

const fmt = (iso?: string | null) => {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch {
        return "";
    }
};

const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

function toAbsolute(u?: string | null) {
    if (!u) return undefined;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${apiBase}${u.startsWith("/") ? "" : "/"}${u}`;
}

function joinParts(parts: (string | undefined | null)[], sep = " • ") {
    return parts.filter(Boolean).map(String).join(sep);
}

export default function EventCard({
    event,
    onClick,
}: {
    event: EventItem;
    onClick?: () => void;
}) {
    const absoluteImg = toAbsolute(event.imageUrl ?? undefined);
    const img =
        absoluteImg && absoluteImg.trim().length > 0
            ? absoluteImg
            : `https://picsum.photos/seed/${event.id}/600/300`;

    const meta = joinParts([fmt(event.dateTime), event.location]);

    return (
        <article
            className="card event-card"
            onClick={onClick}
            style={{ cursor: onClick ? "pointer" : "default", overflow: "hidden" }}
            role={onClick ? "button" : undefined}
            aria-label={event.title ? `Open ${event.title}` : "Event card"}
        >
            <div className="card-image" style={{ height: 140, overflow: "hidden" }}>
                <img src={img} alt={event.title ?? "event image"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            <div className="card-body" style={{ padding: "12px 14px" }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                    {event.title ?? "Untitled event"}
                </h3>

                {meta && <p className="card-meta" style={{ margin: "6px 0", color: "var(--muted-fg)", fontSize: "0.9rem" }}>{meta}</p>}

                {event.participantCount != null && (
                    <div style={{ marginBottom: 8, fontSize: "0.85rem", color: "var(--muted-fg)" }}>
                        {event.participantCount}{" "}
                        {event.participantCount === 1 ? "person" : "people"}
                    </div>
                )}

                {event.description && (
                    <p className="card-desc" style={{ margin: 0, color: "var(--muted-fg)", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {event.description}
                    </p>
                )}
            </div>
        </article>
    );
}