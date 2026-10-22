// src/components/EventModal.tsx
import { useEffect, useState } from "react";
import type { EventItem } from "./EventCard";
import "./EventModal.css";
import ExpenseList from "./ExpenseList";
import BalanceOverview from "./BalanceOverview";
import { updateEvent, deleteEvent, sendInvitation, listEventInvitations } from "../api/expenses";
import { uploadImage } from "../api/uploads";

const toAbsolute = (u?: string) =>
    !u
        ? ""
        : u.startsWith("http://") || u.startsWith("https://")
            ? u
            : `${import.meta.env.VITE_API_BASE ?? "http://localhost:8080"}${u.startsWith("/") ? "" : "/"}${u}`;

export default function EventModal(props: any) {
    const { event, onSaved, onDeleted, onClose } = props;
    const [title, setTitle] = useState(event.title ?? "");
    const [description, setDescription] = useState(event.description ?? "");
    
    // Split datetime into date and time
    const initialDateTime = event.dateTime || "";
    const [date, setDate] = useState(initialDateTime ? initialDateTime.slice(0, 10) : "");
    const [time, setTime] = useState(initialDateTime ? initialDateTime.slice(11, 16) : "");
    
    const [location, setLocation] = useState(event.location ?? "");
    const [imageUrl, setImageUrl] = useState(event.imageUrl);
    const [previewAbs, setPreviewAbs] = useState<string | null>(
        event.imageUrl ? toAbsolute(event.imageUrl) : null
    );
    const [uploading, setUploading] = useState(false);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [dragOver, setDragOver] = useState(false);
    const [activeTab, setActiveTab] = useState<"details" | "expenses" | "balances" | "invitations">("details");

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteMessage, setInviteMessage] = useState("");
    const [inviting, setInviting] = useState(false);
    const [invites, setInvites] = useState<Array<{ id: number; email: string; status: string; sentAt: string; respondedAt?: string; userName?: string }>>([]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        const { overflow } = document.body.style;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = overflow;
        };
    }, []);

    useEffect(() => {
        let cancel = false;
        const loadInvites = async () => {
            try {
                const list = await listEventInvitations(event.id);
                if (!cancel) setInvites(list);
            } catch {
                // ignore
            }
        };
        loadInvites();
        return () => { cancel = true; };
    }, [event.id]);

    // DELETE the old uploadFile, onPickFile, handleDroppedFiles functions
    // and ADD these:
    const onFile = async (file: File) => {
        if (!file.type.startsWith("image/")) { alert("Please select an image file"); return; }
        setUploading(true);
        try {
            const url = await uploadImage(file);       // uses apiFetch -> adds Authorization
            // Update backend event immediately with new image
            await updateEvent(event.id, { imageUrl: url });
            // Update local state (don't call onSaved which closes modal)
            setImageUrl(url);
            setPreviewAbs(toAbsolute(url));
            event.imageUrl = url; // mutate prop to reflect in parent after close
        } catch (e) {
            console.error(e);
            alert("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
    };

    const onBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
    };

    const onSave = async () => {
        setError(null);
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        setSaving(true);
        try {
            // Combine date + time
            let dateTime = null;
            if (date && time) {
                dateTime = `${date}T${time}:00`;
            } else if (date) {
                dateTime = `${date}T00:00:00`;
            }

            const payload: Partial<EventItem> = {
                id: event.id,
                title: title.trim(),
                description: description.trim(),
                dateTime,
                location: location.trim(),
                imageUrl: imageUrl?.trim() || undefined,
            };

            const updated = await updateEvent(event.id, payload);
            onSaved(updated);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        const ok = window.confirm("Delete this event? This action cannot be undone.");
        if (!ok) return;

        setDeleting(true);
        try {
            await deleteEvent(event.id);

            onDeleted(event.id);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            await sendInvitation(event.id, inviteEmail.trim(), inviteMessage.trim() || undefined);
            setInviteEmail("");
            setInviteMessage("");
            const list = await listEventInvitations(event.id);
            setInvites(list);
        } catch (e) {
            alert("Failed to send invitation");
            console.error(e);
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} aria-hidden="true">
            <div className="modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="modal-scroller">
                    <div className="modal-content">
                        {/* Header */}
                        <div className="modal-header">
                          <h2 id="event-modal-title">{event.title}</h2>
                          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
                        </div>

                        {/* Tabs */}
                        <div className="tabs-container">
                          <button className={activeTab === "details" ? "tab active" : "tab"} onClick={() => setActiveTab("details")}>Details</button>
                          <button className={activeTab === "expenses" ? "tab active" : "tab"} onClick={() => setActiveTab("expenses")}>Expenses</button>
                          <button className={activeTab === "balances" ? "tab active" : "tab"} onClick={() => setActiveTab("balances")}>Balances</button>
                          <button className={activeTab === "invitations" ? "tab active" : "tab"} onClick={() => setActiveTab("invitations")}>
                            Invitations
                          </button>
                        </div>

                        {/* Tab content */}
                        {activeTab === "details" && (
                          <div style={{ display: "grid", gap: "var(--space-xs)" }}>
                            {/* Image dropzone + preview */}
                            <div
                              className={"dropzone" + (dragOver ? " dropzone--active" : "")}
                              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                              onDragLeave={() => setDragOver(false)}
                              onDrop={onDrop}
                              style={{ marginBottom: 16 }}
                            >
                              {previewAbs ? (
                                <img src={previewAbs} alt="Event" />
                              ) : (
                                <div>Drag & drop an image here, or pick a file</div>
                              )}
                              <div style={{ marginTop: 8 }}>
                                <input type="file" accept="image/*" onChange={onBrowse} disabled={uploading} />
                              </div>
                              {uploading && <div style={{ marginTop: 8 }}>Uploading…</div>}
                            </div>

                            <div className="form-grid">
                                <div className="field">
                                    <label className="field__label">Title *</label>
                                    <input 
                                        className="input" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        placeholder="Event title"
                                        required 
                                    />
                                </div>

                                <div className="field">
                                    <label className="field__label">Description</label>
                                    <textarea 
                                        className="textarea" 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        rows={3}
                                        placeholder="Event description (optional)"
                                    />
                                </div>

                                <div className="field">
                                    <label className="field__label">Date</label>
                                    <input 
                                        className="input" 
                                        type="date" 
                                        value={date} 
                                        onChange={(e) => setDate(e.target.value)} 
                                    />
                                </div>

                                <div className="field">
                                    <label className="field__label">Time</label>
                                    <input 
                                        className="input" 
                                        type="time" 
                                        value={time} 
                                        onChange={(e) => setTime(e.target.value)} 
                                    />
                                </div>

                                <div className="field">
                                    <label className="field__label">Location</label>
                                    <input 
                                        className="input" 
                                        value={location} 
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Event location (optional)" 
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="form-error">
                                    {error}
                                </div>
                            )}

                            {/* Actions (only show on details tab) */}
                            <div className="form-actions">
                                <button 
                                    className="btn btn-danger" 
                                    onClick={onDelete} 
                                    disabled={deleting}
                                >
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={onSave} 
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                          </div>
                        )}

                        {activeTab === "expenses" && (
                          <div>
                            <ExpenseList eventId={event.id} />
                          </div>
                        )}

                        {activeTab === "balances" && (
                          <div>
                            <BalanceOverview eventId={event.id} />
                          </div>
                        )}

                        {activeTab === "invitations" && (
                          <div className="modal-section" style={{ display: "grid", gap: 12 }}>
                            <h3 style={{ margin: 0 }}>Invite people</h3>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <input
                                className="input"
                                type="email"
                                placeholder="friend@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                style={{ flex: "1 1 260px" }}
                              />
                              <input
                              className="input"
                              placeholder="Optional message"
                              value={inviteMessage}
                              onChange={(e) => setInviteMessage(e.target.value)}
                            />
                              <button
                                className="btn btn-primary"
                                onClick={handleSendInvite}
                                disabled={inviting || !inviteEmail.trim()}
                              >
                                {inviting ? "Sending..." : "Send invite"}
                              </button>
                            </div>

                            {invites.length > 0 ? (
                              <div style={{ marginTop: 8 }}>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>Invitations</div>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {invites.map((i) => (
                                    <li key={i.id} style={{ marginBottom: 4 }}>
                                      {(i.userName || i.email)} — {i.status.toLowerCase()}
                                      {i.respondedAt ? ` (on ${new Date(i.respondedAt).toLocaleDateString()})` : ""}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-muted" style={{ marginTop: 8 }}>No invitations yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                </div>
            </div>
    );
}