import React from 'react';
import { Calendar, Clock, MapPin, Users, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { EventData } from '../types';

interface EventItemProps {
  event: {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
      dateTime?: string;
      date?: string;
    };
    end: {
      dateTime?: string;
      date?: string;
    };
    attendees?: Array<{
      email: string;
      displayName?: string;
    }>;
  };
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const formatDateTime = (dateTime: string) => {
    try {
      const date = parseISO(dateTime);
      return {
        date: format(date, 'MMM do, yyyy'),
        time: format(date, 'h:mm a'),
      };
    } catch {
      return {
        date: dateTime,
        time: '',
      };
    }
  };

  const startDateTime = event.start.dateTime || event.start.date;
  const endDateTime = event.end.dateTime || event.end.date;
  const { date: startDate, time: startTime } = formatDateTime(startDateTime || '');
  const { time: endTime } = formatDateTime(endDateTime || '');

  return (
    <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{event.summary}</h4>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{startDate}</span>
        </div>
        
        {startTime && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>
              {startTime}
              {endTime && startTime !== endTime && ` - ${endTime}`}
            </span>
          </div>
        )}
        
        {event.location && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        
        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      {event.description && (
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{event.description}</p>
      )}
    </div>
  );
};

interface EventCardProps {
  eventData: EventData;
}

export const EventCard: React.FC<EventCardProps> = ({ eventData }) => {
  const { event, events, action, notes, totalCount, eventId } = eventData;

  // Handle calendar_info action with multiple events
  if (action === 'calendar_info' && events && events.length > 0) {
    return (
      <div className="event-card animate-scale-in">
        <div className="event-card-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 flex items-center justify-center">
              <span className="text-lg sm:text-xl">📅</span>
            </div>
            <h3 className="event-card-title text-lg sm:text-xl">Your Events</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4">
            {totalCount} event{totalCount !== 1 ? 's' : ''} found
          </div>
          
          <div className="space-y-3">
            {events.map((eventItem, index) => (
              <EventItem key={eventItem.id || index} event={eventItem} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle list_events intent without structured event data
  // In this case, we'll just return null and let the text be displayed normally
  if (action === 'calendar_info' && (!events || events.length === 0)) {
    return null;
  }

  // Handle cancel_event action - show cancellation confirmation
  if (action === 'cancel_event') {
    return (
      <div className="event-card animate-scale-in">
        <div className="event-card-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-accent flex items-center justify-center">
              <span className="text-lg sm:text-xl">❌</span>
            </div>
            <h3 className="event-card-title text-lg sm:text-xl">Event Cancelled</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-accent-50/50 dark:bg-accent-900/20 rounded-xl border border-accent-200/50 dark:border-accent-700/50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-accent-100 dark:bg-accent-800/50 flex items-center justify-center flex-shrink-0">
                <span className="text-accent-600 dark:text-accent-400 text-sm sm:text-base">✓</span>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-accent-900 dark:text-accent-100 mb-1">Cancellation Confirmed</h4>
                <p className="text-xs sm:text-sm text-accent-800 dark:text-accent-200">
                  The event has been successfully cancelled and removed from your calendar.
                </p>
              </div>
            </div>
          </div>

          {eventId && (
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Event ID: {eventId}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!event) return null;

  const formatDateTime = (dateTime: string) => {
    try {
      const date = parseISO(dateTime);
      return {
        date: format(date, 'EEEE, MMMM do, yyyy'),
        time: format(date, 'h:mm a'),
      };
    } catch {
      return {
        date: dateTime,
        time: '',
      };
    }
  };

  const getActionIcon = () => {
    switch (action as EventData['action']) {
      case 'create_event':
        return '✅';
      case 'update_event':
        return '✏️';
      case 'cancel_event':
        return '❌';
      case 'prepare_event':
        return '📋';
      case 'followup_event':
        return '🔄';
      case 'calendar_info':
        return '📅';
      case 'multiple_intents':
        return '🔗';
      default:
        return '📅';
    }
  };

  const getActionText = () => {
    switch (action as EventData['action']) {
      case 'create_event':
        return 'Event Created';
      case 'update_event':
        return 'Event Updated';
      case 'cancel_event':
        return 'Event Cancelled';
      case 'prepare_event':
        return 'Event Details';
      case 'followup_event':
        return 'Follow-up Scheduled';
      case 'calendar_info':
        return 'Calendar Info';
      case 'multiple_intents':
        return 'Multiple Actions';
      default:
        return 'Calendar Action';
    }
  };

  const startDateTime = event.start.dateTime || event.start.date;
  const endDateTime = event.end.dateTime || event.end.date;
  const { date: startDate, time: startTime } = formatDateTime(startDateTime || '');
  const { time: endTime } = formatDateTime(endDateTime || '');

  return (
    <div className="event-card animate-scale-in">
      <div className="event-card-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 flex items-center justify-center">
            <span className="text-lg sm:text-xl">{getActionIcon()}</span>
          </div>
          <h3 className="event-card-title text-lg sm:text-xl">{getActionText()}</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg sm:text-xl mb-2">{event.summary}</h4>
          {event.description && (
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{event.description}</p>
          )}
        </div>

        <div className="event-card-meta">
          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-600 rounded-xl">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base">{startDate}</span>
          </div>

          {startTime && (
            <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-600 rounded-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                {startTime}
                {endTime && startTime !== endTime && ` - ${endTime}`}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-600 rounded-xl">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base truncate">{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-600 rounded-xl">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {event.attendees && event.attendees.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Attendees:</h5>
            <div className="flex flex-wrap gap-2">
              {event.attendees.map((attendee, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 font-medium border border-slate-200/50 dark:border-slate-600/50"
                >
                  {attendee.displayName || attendee.email}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes && (
          <div className="mt-6 p-3 sm:p-4 bg-info-50 dark:bg-info-900/20 rounded-2xl border border-info-200 dark:border-info-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-info-100 dark:bg-info-800/50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-info-600 dark:text-info-400" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-semibold text-info-900 dark:text-info-100 mb-2">Preparation Notes:</h5>
                <p className="text-xs sm:text-sm text-info-800 dark:text-info-200 whitespace-pre-wrap leading-relaxed">{notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

