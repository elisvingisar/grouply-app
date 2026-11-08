package ee.grouply.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Event entity updated with creator, participants and invitations relations.
 */
@JsonIgnoreProperties({
    "creator",
    "participants",
    "invitations"
})
@Entity
@Table(name = "event")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 5000)
    private String description;

    private LocalDateTime dateTime;

    private String location;

    @Column(length = 2048)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "event_participant",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants = new HashSet<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventInvitation> invitations = new ArrayList<>();

    public Event() {}

    public Event(String title, String description, LocalDateTime dateTime, String location) {
        this.title = title;
        this.description = description;
        this.dateTime = dateTime;
        this.location = location;
    }

    // -- getters / setters --

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDateTime() { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public User getCreator() { return creator; }
    public void setCreator(User creator) { this.creator = creator; }

    public Set<User> getParticipants() { return participants; }
    public void setParticipants(Set<User> participants) { this.participants = participants; }

    public List<EventInvitation> getInvitations() { return invitations; }
    public void setInvitations(List<EventInvitation> invitations) { this.invitations = invitations; }

    // helper methods
    public void addParticipant(User user) {
        if (user == null) return;
        participants.add(user);
        user.getParticipatingEvents().add(this);
    }

    public void removeParticipant(User user) {
        if (user == null) return;
        participants.remove(user);
        user.getParticipatingEvents().remove(this);
    }

    public void addInvitation(EventInvitation inv) {
        if (inv == null) return;
        invitations.add(inv);
        inv.setEvent(this);
    }

    public void removeInvitation(EventInvitation inv) {
        if (inv == null) return;
        invitations.remove(inv);
        inv.setEvent(null);
    }
}