import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, getToken, saveAuth, type StoredUser } from "../api/auth";
import { listPendingInvitations } from "../api/expenses";
import "./NavBar.css";

function readStoredUser(): StoredUser | null {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredUser;
        return parsed?.name ? parsed : null;
    } catch {
        return null;
    }
}

export default function NavBar() {
    const [pendingCount, setPendingCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<StoredUser | null>(() => readStoredUser());

    useEffect(() => {
        let cancel = false;
        listPendingInvitations()
            .then(list => {
                if (!cancel) setPendingCount(list.length);
            })
            .catch(() => { });
        return () => { cancel = true; };
    }, []);

    // If we have a ticket but no name sticky note yet, ask the backend once.
    useEffect(() => {
        if (user?.name) return;
        const token = getToken();
        if (!token) return;

        let cancel = false;
        getCurrentUser().then((me) => {
            if (cancel || !me?.name) return;
            const next: StoredUser = { id: me.id, email: me.email, name: me.name };
            saveAuth(token, next);
            setUser(next);
        });
        return () => { cancel = true; };
    }, [user?.name]);

    const handleLogout = () => {
        clearToken();
        window.location.href = "/login";
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    <a href="/" className="navbar-brand">
                        <span className="brand-text">Grouply</span>
                    </a>

                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <div className={`navbar-menu ${mobileMenuOpen ? "active" : ""}`}>
                        <a href="/" className="nav-link">
                            Events
                        </a>
                        <a href="/invitations" className="nav-link">
                            Invitations
                            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                        </a>

                        <div className="navbar-actions">
                            <div className="user-menu">
                                <button className="user-button">
                                    <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
                                    <span className="user-name">{user?.name || "User"}</span>
                                </button>
                                <div className="user-dropdown">
                                    <a href="/profile" className="dropdown-item">
                                        Profile
                                    </a>
                                    <button onClick={handleLogout} className="dropdown-item">
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}