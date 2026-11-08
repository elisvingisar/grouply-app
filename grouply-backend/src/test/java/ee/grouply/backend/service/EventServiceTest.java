package ee.grouply.backend.service;

import ee.grouply.backend.dto.EventCreateDTO;
import ee.grouply.backend.dto.EventDTO;
import ee.grouply.backend.entity.Event;
import ee.grouply.backend.entity.User;
import ee.grouply.backend.error.ForbiddenException;
import ee.grouply.backend.error.NotFoundException;
import ee.grouply.backend.repo.EventRepository;
import ee.grouply.backend.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {
    
    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EventService eventService;

    private User testUser;
    private User otherUser;
    private Event testEvent;
    private EventCreateDTO createDTO;

    @BeforeEach
    void setUp() {
        // Create a test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");

        // Another user for auth testing
        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setName("Other User");
        otherUser.setEmail("other@example.com");

        // Test event
        testEvent = new Event();
        testEvent.setId(1L);
        testEvent.setTitle("Test Event");
        testEvent.setDescription("Test Description");
        testEvent.setDateTime(LocalDateTime.now().plusDays(7));
        testEvent.setLocation("Tallinn");
        testEvent.setCreator(testUser);
        testEvent.addParticipant(testUser);

        // DTO for creating the event
        createDTO = new EventCreateDTO();
        createDTO.setTitle("New Event");
        createDTO.setDescription("New Description");
        createDTO.setDateTime(LocalDateTime.now().plusDays(14));
        createDTO.setLocation("Tartu");
    }

    // ══════════════════════════════════════════════════════════════════
    // createEvent() tests
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("createEvent()")
    class CreateEventTests {

        @Test
        @DisplayName("should create event successfully")
        void shouldCreateEventSuccessfully() {
            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.save(any(Event.class)))
                    .thenAnswer(invocation -> {
                        Event saved = invocation.getArgument(0);
                        saved.setId(1L);
                        return saved;
                    });

            EventDTO result = eventService.createEvent(createDTO, "test@example.com");

            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("New Event");
            assertThat(result.getLocation()).isEqualTo("Tartu");

            verify(eventRepository, times(1)).save(any(Event.class));
        }

        @Test
        @DisplayName("should throw NotFoundException if no user found")
        void shouldThrowWhenUserNotFound() {   
            when(userRepository.findByEmail("unknown@example.com"))
                    .thenReturn(Optional.empty());
            
            assertThatThrownBy(() -> 
                    eventService.createEvent(createDTO, "unknown@example.com"))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // getEventById() tests
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getEventById()")
    class GetEventByIdTests {

        @Test
        @DisplayName("should return event when user has access")
        void shouldReturnEventWhenUserHasAccess() {
            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.findById(1L))
                    .thenReturn(Optional.of(testEvent));

            EventDTO result = eventService.getEventById(1L, "test@example.com");

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getTitle()).isEqualTo("Test Event");
        }

        @Test
        @DisplayName("should throw NotFoundException if no event")
        void shouldThrowWhenEventNotFound() {
            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.findById(999L))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> 
                    eventService.getEventById(999L, "test@example.com"))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Event not found");   
        }

        @Test
        @DisplayName("should throw ForbiddenException if user has no access")
        void shouldThrowWhenUserHasNoAccess() {
            when(userRepository.findByEmail("other@example.com"))
                    .thenReturn(Optional.of(otherUser));
            when(eventRepository.findById(1L))
                    .thenReturn(Optional.of(testEvent));

            assertThatThrownBy(() -> 
                    eventService.getEventById(1L, "other@example.com"))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("don't have access");   
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // updateEvent() tests
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("updateEvent()")
    class UpdateEventTests {
        
        @Test
        @DisplayName("should update event when user is creator")
        void shouldUpdateEventWhenUserIsCreator() {
            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.findById(1L))
                    .thenReturn(Optional.of(testEvent));
            when(eventRepository.save(any(Event.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            
            EventDTO result = eventService.updateEvent(1L, createDTO, "test@example.com");

            assertThat(result.getTitle()).isEqualTo("New Event");
            assertThat(result.getLocation()).isEqualTo("Tartu");
            verify(eventRepository).save(any(Event.class));
        }

        @Test
        @DisplayName("should throw ForbiddenException when user is not creator")
        void shouldThrowWhenUserIsNotCreator() {
            when(userRepository.findByEmail("other@example.com"))
                    .thenReturn(Optional.of(otherUser));
            when(eventRepository.findById(1L))
                    .thenReturn(Optional.of(testEvent));

            assertThatThrownBy(() -> 
                    eventService.updateEvent(1L, createDTO, "other@example.com"))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Only the creator");

            verify(eventRepository, never()).save(any());
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // deleteEvent() tests
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("deleteEvent()")
    class DeleteEventTests {

        @Test
        @DisplayName("should delete event when user is creator")
        void shouldDeleteEventWhenUserIsCreator() {
            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.findById(1L))
                    .thenReturn(Optional.of(testEvent));

            eventService.deleteEvent(1L, "test@example.com");

            verify(eventRepository).deleteById(1L);
        }

        @Test
        @DisplayName("should throw ForbiddenException when user is not creator")
        void shouldThrowWhenUserIsNotCreator() {
            when(userRepository.findByEmail("other@example.com"))
                    .thenReturn(Optional.of(otherUser));
            when(eventRepository.findById(1L))
                    .thenReturn(Optional.of(testEvent));

            assertThatThrownBy(() -> 
                    eventService.deleteEvent(1L, "other@example.com"))
                    .isInstanceOf(ForbiddenException.class);
            
            verify(eventRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("should throw NotFoundException if no event found")
        void shouldThrowWhenEventNotFound() {
            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.findById(999L))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> 
                    eventService.deleteEvent(999L, "test@example.com"))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // getEventsForUser() tests
    // ══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getEventsForUser()")
    class GetEventsForUserTests {

        @Test
        @DisplayName("should return only user's events")
        void shouldReturnOnlyUserEvents() {
            Event otherEvent = new Event();
            otherEvent.setId(2L);
            otherEvent.setTitle("Other Event");
            otherEvent.setCreator(otherUser);

            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.findAll())
                    .thenReturn(List.of(testEvent, otherEvent));

            List<EventDTO> result = eventService.getEventsForUser("test@example.com");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTitle()).isEqualTo("Test Event");
        }

        @Test
        @DisplayName("should return empty list when no events")
        void shouldReturnEmptyListWhenNoEvents() {
            when(userRepository.findByEmail("test@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(eventRepository.findAll())
                    .thenReturn(List.of());

            List<EventDTO> result = eventService.getEventsForUser("test@example.com");

            assertThat(result).isEmpty();
        }
    }
}
