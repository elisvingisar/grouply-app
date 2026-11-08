package ee.grouply.backend.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ee.grouply.backend.entity.Event;
import ee.grouply.backend.dto.EventCreateDTO;
import ee.grouply.backend.dto.EventDTO;
import ee.grouply.backend.repo.EventRepository;
import ee.grouply.backend.repo.UserRepository;
import ee.grouply.backend.entity.User;
import ee.grouply.backend.error.ForbiddenException;
import ee.grouply.backend.error.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import ee.grouply.backend.dto.ParticipantDTO;
import java.util.List;

@Service
public class EventService {

    private static final Logger log = LoggerFactory.getLogger(EventService.class);

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public EventDTO createEvent(EventCreateDTO dto, String email) {
        log.debug("Creating event '{}' for user {}", dto.getTitle(), email);

        User user = findUserByEmail(email);

        Event event = new Event();
        event.setCreator(user);
        event.setDateTime(dto.getDateTime());
        event.setDescription(dto.getDescription());
        event.setImageUrl(dto.getImageUrl());
        event.setLocation(dto.getLocation());
        event.setTitle(dto.getTitle());
        event.addParticipant(user); // The creator is automatically participant

        Event saved = eventRepository.save(event);

        log.info("Created event id={} title='{}' by user={}", saved.getId(), saved.getTitle(), email);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<EventDTO> getEventsForUser(String email) {
        log.debug("Fetching events for user {}", email);

        User user = findUserByEmail(email);

        List<Event> events = eventRepository.findAll().stream()
                .filter(e -> isUserRelatedToEvent(user, e))
                .toList();

        log.debug("Found {} events for user {}", events.size(), email);
        return events.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public EventDTO getEventById(Long id, String email) {
        log.debug("Fetching event id={} for user {}", id, email);

        User user = findUserByEmail(email);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found with id: " + id));

        // Can the user see this event
        if (!isUserRelatedToEvent(user, event)) {
            throw new ForbiddenException("You don't have access to this event");
        }
        return toDto(event);
    }

    @Transactional
    public EventDTO updateEvent(Long id, EventCreateDTO dto, String email) {
        log.debug("Updating event id={} by user {}", id, email);

        User user = findUserByEmail(email);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found with id: " + id));

        if (!isCreator(user, event)) {
            throw new ForbiddenException("Only the creator can update this event");
        }        

        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setDateTime(dto.getDateTime());
        event.setLocation(dto.getLocation());
        event.setImageUrl(dto.getImageUrl());

        Event saved = eventRepository.save(event);
        log.info("Updated event id={}", id);

        return toDto(saved);
    }

    @Transactional
    public void deleteEvent(Long id, String email) {
        log.debug("Deleting event id={} by user {}", id, email);

        User user = findUserByEmail(email);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found with id: " + id));

        if (!isCreator(user, event)) {
            throw new ForbiddenException("Only the creator can delete this event");
        }

        eventRepository.deleteById(id);
        log.info("Deleted event id={}", id);
    }

    @Transactional(readOnly = true)
    public List<ParticipantDTO> getParticipants(Long eventId, String email) {
        log.debug("Fetching participants for event id={}", eventId);

        User user = findUserByEmail(email);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event not found with id: " + eventId));

        if (!isUserRelatedToEvent(user, event)) {
            throw new ForbiddenException("You don't have access to this event");
        }

        return event.getParticipants().stream()
                .map(u -> new ParticipantDTO(u.getId(), u.getName(), u.getEmail()))
                .toList();
    }


    // ══════════════════════════════════════════════════════════════════
    // PRIVATE HELPER METHODS
    // ══════════════════════════════════════════════════════════════════

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found: " + email));
    }

    private boolean isUserRelatedToEvent(User user, Event event) {
        return isCreator(user, event) || isParticipant(user, event);
    }

    private boolean isCreator(User user, Event event) {
        return event.getCreator() != null
                && event.getCreator().getId().equals(user.getId());
    }

    private boolean isParticipant(User user, Event event) {
        return event.getParticipants().contains(user);
    }

    private EventDTO toDto(Event event) {
        EventDTO dto = new EventDTO();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setDateTime(event.getDateTime());
        dto.setLocation(event.getLocation());
        dto.setParticipantCount(event.getParticipants() != null ? event.getParticipants().size() : 0);
        dto.setImageUrl(event.getImageUrl());
        return dto;
    }
}
