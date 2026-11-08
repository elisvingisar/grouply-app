import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../api/expenses";
import { uploadImage } from "../api/uploads";
import "./NewEventPage.css";

export default function NewEventPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const onBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSaving(true);
      // Combine date + time if both present
      let dateTime = null;
      if (date && time) {
        dateTime = `${date}T${time}:00`;
      } else if (date) {
        dateTime = `${date}T00:00:00`;
      }

      await createEvent({
        title,
        description,
        dateTime,
        location,
        imageUrl,
      });
      navigate("/events");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="new-event-page">
      <div className="new-event-container">
        <h1>Create New Event</h1>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          style={{
            border: "2px dashed #bbb",
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
            textAlign: "center",
            background: "#fafafa",
          }}
        >
          {imageUrl ? (
            <img
              src={
                imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
                  ? imageUrl
                  : (import.meta.env.VITE_API_BASE || "http://localhost:8080") + imageUrl
              }
              alt="Event"
              style={{ maxWidth: "100%", borderRadius: 8 }}
            />
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                Drag & drop an image here, or click to browse
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onBrowse}
                disabled={uploading}
              />
            </>
          )}
          {uploading && <div style={{ marginTop: 8 }}>Uploading…</div>}
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="field">
            <label className="field__label">Title *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Game Night"
              required
            />
          </div>

          <div className="field">
            <label className="field__label">Description</label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the event about?"
              rows={3}
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
              placeholder="Where will it be?"
            />
          </div>

          {error && (
            <div className="form-error">{error}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/events")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}