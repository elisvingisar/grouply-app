import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listEvents } from "../api/expenses";
import EventModal from "../components/EventModal";
import calendarIcon from "../assets/icons/calendar.svg";
import mapPinIcon from "../assets/icons/map-pin.svg";
import peopleIcon from "../assets/icons/people.svg";
import "./EventsPage.css";

type EventDTO = {
  id: number;
  title: string;
  description?: string;
  dateTime?: string;
  location?: string;
  participantCount?: number;
  imageUrl?: string | null;
};

const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/+$/, "");

function formatEventDate(dateTime: string) {
  const d = new Date(dateTime);
  return `${d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function eventImageUrl(imageUrl: string) {
  return imageUrl.startsWith("http") ? imageUrl : apiBase + imageUrl;
}

function sortEventsBySoonest(events: EventDTO[]): EventDTO[] {
  return [...events].sort((a, b) => {
    if (!a.dateTime && !b.dateTime) return 0;
    if (!a.dateTime) return 1;
    if (!b.dateTime) return -1;
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
  const navigate = useNavigate();

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await listEvents();
      setEvents(sortEventsBySoonest(data));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEventClick = (event: EventDTO) => {
    setSelectedEvent(event);
  };

  const handleEventSaved = (updated: any) => {
    setEvents((prev) =>
      sortEventsBySoonest(
        prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
      )
    );
    setSelectedEvent(null);
  };

  const handleEventDeleted = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  };

  if (loading) return <div className="events-page"><div className="page-loading">Loading events...</div></div>;
  if (error) return <div className="events-page"><div className="page-error">Error: {error}</div></div>;

  return (
    <>
      <div className="events-page">
        <div className="events-page__inner">
          <div className="events-header">
            <div className="events-header__text">
              <h1>My Events</h1>
              <p className="events-header__subtitle">
                Track shared balances and clear settle-ups.
              </p>
            </div>
            <button
              className="events-btn events-btn--primary"
              onClick={() => navigate("/events/new")}
            >
              + New group event
            </button>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <p>Nothing to split yet. Create an event when the next trip or dinner is on.</p>
              <button
                className="events-btn events-btn--primary"
                onClick={() => navigate("/events/new")}
              >
                + New group event
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="event-card"
                  onClick={() => handleEventClick(event)}
                >
                  {event.imageUrl ? (
                    <div
                      className="event-card__image"
                      style={{ backgroundImage: `url(${eventImageUrl(event.imageUrl)})` }}
                    />
                  ) : (
                    <div className="event-card__image event-card__image--empty" />
                  )}

                  <div className="event-card__content">
                    <h3 className="event-card__title">{event.title}</h3>
                    {event.description ? (
                      <p className="event-card__description">{event.description}</p>
                    ) : (
                      <p className="event-card__description event-card__description--muted">
                        No description yet.
                      </p>
                    )}

                    <div className="event-card__divider" />

                    <div className="event-card__meta">
                      {event.dateTime && (
                        <div className="event-card__meta-row">
                          <img src={calendarIcon} alt="" className="event-card__icon" />
                          <span>{formatEventDate(event.dateTime)}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="event-card__meta-row">
                          <img src={mapPinIcon} alt="" className="event-card__icon" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="event-card__meta-row">
                        <img src={peopleIcon} alt="" className="event-card__icon" />
                        <span>
                          {event.participantCount ?? 0}{" "}
                          {(event.participantCount ?? 0) === 1 ? "person" : "people"}
                        </span>
                      </div>
                    </div>

                    <div className="event-card__divider" />

                    {/* Placeholder until balance summary API exists */}
                    <div className="event-card__footer">
                      <div className="event-card__total">
                        <span className="event-card__total-label">Total split</span>
                        <span className="event-card__total-value">—</span>
                      </div>
                      <span className="event-card__status event-card__status--pending">
                        Balance soon
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent as any}
          onClose={() => setSelectedEvent(null)}
          onSaved={handleEventSaved}
          onDeleted={handleEventDeleted}
        />
      )}
    </>
  );
}
