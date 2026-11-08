import { useEffect, useState } from "react";
import { listPendingInvitations, acceptInvitation, declineInvitation } from "../api/expenses";
import "./InvitationsPage.css";

type Invitation = {
  id: number;
  eventId: number;
  eventTitle: string;
  invitedBy: string;
  message?: string;
  sentAt: string;
};

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listPendingInvitations();
      setInvitations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (id: number) => {
    await acceptInvitation(id);
    load();
  };

  const handleDecline = async (id: number) => {
    await declineInvitation(id);
    load();
  };

  return (
    <div className="invitations-page">
      <div className="invitations-page__inner">
        <div className="invitations-header">
          <h1>Invitations</h1>
          <p className="invitations-header__subtitle">
            Accept or decline invites to join a group event.
          </p>
        </div>

        {loading && <div className="invitations-loading">Loading invitations…</div>}

        {!loading && invitations.length === 0 && (
          <div className="invitations-empty">
            <p>No pending invitations right now.</p>
          </div>
        )}

        {!loading && invitations.length > 0 && (
          <ul className="invitations-list">
            {invitations.map((inv) => (
              <li key={inv.id} className="invitation-card">
                <h2 className="invitation-card__title">{inv.eventTitle}</h2>
                <p className="invitation-card__meta">Invited by {inv.invitedBy}</p>
                {inv.message && (
                  <p className="invitation-card__message">{inv.message}</p>
                )}
                <div className="invitation-card__actions">
                  <button
                    type="button"
                    className="invitations-btn invitations-btn--primary"
                    onClick={() => handleAccept(inv.id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="invitations-btn invitations-btn--secondary"
                    onClick={() => handleDecline(inv.id)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
