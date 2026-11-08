import { useEffect, useState } from "react";
import { listBalances, listExpenses, listUsers } from "../api/expenses";
import type { StoredUser } from "../api/auth";

type EventSnapshot = {
  id: number;
  title?: string;
  description?: string | null;
  dateTime?: string | null;
  location?: string | null;
  imageUrl?: string | null;
};

type Participant = { id: number; name: string; email: string };
type BalanceRow = { userId: number; name: string; balance: number | string };

type Props = {
  event: EventSnapshot;
  imagePreviewUrl?: string | null;
  onGoToBalances: () => void;
  /** Change this to force a reload (e.g. when returning to Overview). */
  reloadToken?: number;
};

const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/+$/, "");

function toAbsolute(u?: string | null) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${apiBase}${u.startsWith("/") ? "" : "/"}${u}`;
}

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    return parsed?.id != null ? parsed : null;
  } catch {
    return null;
  }
}

function formatDateTime(dateTime?: string | null) {
  if (!dateTime) return null;
  const d = new Date(dateTime);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function money(n: number) {
  return `${n.toFixed(2)} €`;
}

export default function EventOverview({
  event,
  imagePreviewUrl,
  onGoToBalances,
  reloadToken = 0,
}: Props) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantsError, setParticipantsError] = useState(false);

  const [expenseTotal, setExpenseTotal] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [expensesError, setExpensesError] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const [myBalance, setMyBalance] = useState<number | null>(null);
  const [peopleStillOwe, setPeopleStillOwe] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [balancesError, setBalancesError] = useState(false);
  const [balancesLoading, setBalancesLoading] = useState(true);

  const cover = imagePreviewUrl || toAbsolute(event.imageUrl);
  const when = formatDateTime(event.dateTime);

  useEffect(() => {
    let cancel = false;

    setParticipantsError(false);
    setExpensesError(false);
    setBalancesError(false);
    setExpensesLoading(true);
    setBalancesLoading(true);

    const me = readStoredUser();

    listUsers(event.id)
      .then((list) => {
        if (!cancel) setParticipants(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancel) {
          setParticipants([]);
          setParticipantsError(true);
        }
      });

    listExpenses(event.id)
      .then((list) => {
        if (cancel) return;
        const rows = Array.isArray(list) ? list : [];
        const total = rows.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        setExpenseCount(rows.length);
        setExpenseTotal(total);
      })
      .catch(() => {
        if (!cancel) {
          setExpenseCount(0);
          setExpenseTotal(0);
          setExpensesError(true);
        }
      })
      .finally(() => {
        if (!cancel) setExpensesLoading(false);
      });

    listBalances(event.id)
      .then((list: BalanceRow[]) => {
        if (cancel) return;
        const rows = Array.isArray(list) ? list : [];
        const mine = me
          ? rows.find((b) => Number(b.userId) === Number(me.id))
          : undefined;
        setMyBalance(mine != null ? Number(mine.balance) : null);

        const debtors = rows.filter((b) => Number(b.balance) > 0.005);
        setPeopleStillOwe(debtors.length);
        setOutstanding(
          debtors.reduce((sum, b) => sum + Number(b.balance), 0)
        );
      })
      .catch(() => {
        if (!cancel) {
          setMyBalance(null);
          setPeopleStillOwe(0);
          setOutstanding(0);
          setBalancesError(true);
        }
      })
      .finally(() => {
        if (!cancel) setBalancesLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [event.id, reloadToken]);

  const peopleLabel =
    participants.length === 1 ? "1 person" : `${participants.length} people`;

  let myBalanceLabel = "Balance unavailable";
  let myBalanceClass = "overview-balance--muted";
  if (!balancesLoading && !balancesError && myBalance != null) {
    if (Math.abs(myBalance) < 0.005) {
      myBalanceLabel = "Settled";
      myBalanceClass = "overview-balance--settled";
    } else if (myBalance > 0) {
      myBalanceLabel = `You owe ${money(myBalance)}`;
      myBalanceClass = "overview-balance--owe";
    } else {
      myBalanceLabel = `Owed to you ${money(Math.abs(myBalance))}`;
      myBalanceClass = "overview-balance--owed";
    }
  } else if (balancesLoading) {
    myBalanceLabel = "Loading…";
  }

  let groupStatus = "Status unavailable";
  if (!balancesLoading && !balancesError) {
    if (peopleStillOwe === 0 || outstanding < 0.005) {
      groupStatus = "All settled";
    } else if (peopleStillOwe === 1) {
      groupStatus = `1 person still owes · ${money(outstanding)} outstanding`;
    } else {
      groupStatus = `${peopleStillOwe} people still owe · ${money(outstanding)} outstanding`;
    }
  } else if (balancesLoading) {
    groupStatus = "Loading…";
  }

  return (
    <div className="overview">
      <div className="overview-main">
        <section className="overview-card overview-details">
          <div
            className={
              cover
                ? "overview-cover"
                : "overview-cover overview-cover--empty"
            }
            style={cover ? { backgroundImage: `url(${cover})` } : undefined}
            role="img"
            aria-label={cover ? "Event cover" : "No cover image"}
          />
          <div className="overview-snapshot">
            <h3 className="overview-title">{event.title || "Untitled event"}</h3>
            <div className="overview-meta">
              <div className="overview-meta-row">
                <span className="overview-meta-label">Date</span>
                <span>{when?.date ?? "—"}</span>
              </div>
              <div className="overview-meta-row">
                <span className="overview-meta-label">Time</span>
                <span>{when?.time ?? "—"}</span>
              </div>
              <div className="overview-meta-row">
                <span className="overview-meta-label">Location</span>
                <span>{event.location?.trim() || "—"}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="overview-card overview-card--pad overview-participants">
          <button
            type="button"
            className="overview-toggle"
            onClick={() => setParticipantsOpen((o) => !o)}
            aria-expanded={participantsOpen}
          >
            <div>
              <div className="overview-label">Participants</div>
              <div className="overview-value">
                {participantsError ? "Couldn’t load people" : peopleLabel}
              </div>
              <div className="overview-hint">Members in this event (not pending invites)</div>
            </div>
            <span className="overview-chevron" aria-hidden="true">
              {participantsOpen ? "▴" : "▾"}
            </span>
          </button>
          {participantsOpen && !participantsError && (
            <ul className="overview-people">
              {participants.length === 0 ? (
                <li className="overview-muted">No participants yet</li>
              ) : (
                participants.map((p) => (
                  <li key={p.id}>{p.name || p.email || `User #${p.id}`}</li>
                ))
              )}
            </ul>
          )}
        </section>
      </div>

      {/* Right column, same row as the square */}
      <div className="overview-side">
        <section className="overview-card overview-card--pad">
          <div className="overview-label">Expense total</div>
          {expensesLoading ? (
            <div className="overview-value overview-muted">Loading…</div>
          ) : expensesError ? (
            <div className="overview-value overview-muted">Couldn’t load expenses</div>
          ) : (
            <>
              <div className="overview-value">{money(expenseTotal)}</div>
              <div className="overview-hint">
                {expenseCount === 0
                  ? "No expenses yet"
                  : expenseCount === 1
                    ? "1 expense"
                    : `${expenseCount} expenses`}
              </div>
            </>
          )}
        </section>

        <section className="overview-card overview-card--pad">
          <div className="overview-label">Your balance</div>
          <div className={`overview-value ${myBalanceClass}`}>{myBalanceLabel}</div>
          <button
            type="button"
            className="overview-link"
            onClick={onGoToBalances}
          >
            View balances →
          </button>
        </section>

        <section className="overview-card overview-card--pad">
          <div className="overview-label">Group status</div>
          <div className="overview-value overview-value--sm">{groupStatus}</div>
          <div className="overview-hint">Settle-up actions live on the Balances tab</div>
        </section>
      </div>
    </div>
  );
}
