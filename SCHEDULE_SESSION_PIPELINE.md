# Schedule and Session Creation Pipeline

## Overview

The schedule and session creation pipeline allows administrators to create attendance sessions from predefined camp schedule items. This system provides a structured approach to managing camp activities and tracking attendance.

## Database Schema

### Core Tables

#### `camp_schedule`
Contains predefined schedule items for the camp:
- `id` (text, PRIMARY KEY): Unique identifier for schedule item
- `day` (integer): Day number (1-4)
- `time` (text): Time in HH:MM format
- `activity` (text): Activity name
- `location` (text): Location where activity takes place
- `description` (text, optional): Additional details about the activity

#### `camp_sessions`
Contains actual attendance sessions:
- `id` (uuid, PRIMARY KEY): Unique session identifier
- `name` (text): Session name (usually matches activity)
- `description` (text, optional): Session description
- `session_type` (text): Type of session ('sermon', 'quiet_time', 'activity', 'meal', 'other')
- `start_time` (timestamptz): Session start time
- `end_time` (timestamptz): Session end time
- `schedule_id` (text, FOREIGN KEY): Links to camp_schedule.id
- `qr_code` (text): QR code for attendance check-in
- `created_by` (uuid, FOREIGN KEY): Admin who created the session
- `is_active` (boolean): Whether session is active for attendance
- `created_at` (timestamptz): Creation timestamp

### Database Functions

#### `create_session_from_schedule(schedule_item_id, session_name, session_type, start_time_offset, end_time_offset)`
Creates a single session from a schedule item.

**Parameters:**
- `schedule_item_id` (text): ID of the schedule item
- `session_name` (text): Name for the session
- `session_type` (text): Type of session (default: 'activity')
- `start_time_offset` (interval): Time offset from schedule time (default: '0 minutes')
- `end_time_offset` (interval): Duration of session (default: '1 hour')

**Returns:** UUID of the created session

#### `create_sessions_for_day(day_number)`
Creates sessions for all schedule items on a specific day.

**Parameters:**
- `day_number` (integer): Day number (1-4)

**Returns:** void

**Logic:**
1. Fetches all schedule items for the specified day
2. Determines session type based on activity keywords
3. Creates sessions only if they don't already exist
4. Uses `create_session_from_schedule` for each item

#### `get_sessions_with_schedule()`
Returns sessions with their associated schedule information.

**Returns:** Table with session and schedule data

## Frontend Components

### ScheduleSessionManager.tsx
Main component for managing schedule-based session creation.

**Key Features:**
- Day selection (1-4)
- Display of schedule items for selected day
- Session creation for entire day
- Session activation/deactivation
- Visual indicators for existing sessions

**Session Type Detection:**
- `sermon`: Contains 'devotion' or 'prayer'
- `meal`: Contains 'breakfast', 'lunch', or 'dinner'
- `activity`: Contains 'sports', 'game', or 'tournament'
- `other`: Contains 'free time' or 'pack'
- Default: `activity`

### Schedule.tsx
Displays the camp schedule for all participants.

### ScheduleEditor.tsx
Allows administrators to edit the camp schedule.

### ScheduleFinalizer.tsx
Finalizes the schedule and prevents further changes.

## Pipeline Flow

### 1. Schedule Definition
1. Schedule items are defined in `camp_schedule` table
2. Each item has day, time, activity, location, and description
3. Schedule is organized by day (1-4) and time

### 2. Session Creation
1. Admin selects a day in ScheduleSessionManager
2. System fetches schedule items for that day
3. Admin clicks "Create Sessions for Day X"
4. System attempts to use database function `create_sessions_for_day`
5. If database function fails, falls back to client-side implementation
6. Sessions are created with:
   - Name from activity
   - Type determined by activity keywords
   - Times calculated from schedule day/time
   - Default 1-hour duration
   - Inactive status initially

### 3. Session Management
1. Created sessions appear in the schedule view
2. Admin can activate/deactivate sessions
3. Active sessions are available for attendance tracking
4. Sessions maintain link to original schedule item

### 4. Attendance Tracking
1. Active sessions appear in attendance check-in
2. QR codes are generated for each session
3. Attendance records are linked to sessions
4. Reports show attendance by session

## Error Handling

### Database Function Unavailable
- System attempts to use `create_sessions_for_day` function
- If function doesn't exist, falls back to client-side implementation
- Client-side implementation creates sessions directly via API calls
- Provides feedback about which method was used

### Duplicate Sessions
- System checks for existing sessions before creating new ones
- Prevents duplicate sessions for the same schedule item
- Provides appropriate feedback to user

### Validation
- Validates schedule items exist for selected day
- Ensures proper date/time calculations
- Handles missing or invalid data gracefully

## Configuration

### Base Camp Date
- Currently set to '2025-08-25'
- Can be adjusted in database functions and client code
- Affects all session time calculations

### Session Duration
- Default: 1 hour
- Can be customized per session type
- Configurable in database functions

### Session Types
- Automatically determined from activity keywords
- Can be manually overridden
- Supports: sermon, quiet_time, activity, meal, other

## Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Admin-only access for session creation
- Users can only view their own attendance
- Admins can manage all sessions

### Function Security
- Functions use `SECURITY DEFINER`
- Proper parameter validation
- Error handling for invalid inputs

## Performance Considerations

### Indexes
- `idx_camp_sessions_schedule_id`: For schedule lookups
- `idx_attendance_records_session_id`: For attendance queries
- `idx_camp_sessions_active`: For active session filtering

### Batch Operations
- Client-side implementation uses Promise.all for parallel session creation
- Database function processes all items in a single transaction
- Efficient error handling and rollback

## Future Enhancements

### Potential Improvements
1. **Dynamic Camp Dates**: Allow configuration of camp start date
2. **Session Templates**: Predefined session configurations
3. **Bulk Operations**: Create sessions for multiple days
4. **Advanced Scheduling**: Recurring sessions, time zones
5. **Integration**: Calendar integration, notifications

### Monitoring
1. **Session Analytics**: Track session creation patterns
2. **Performance Metrics**: Monitor function execution times
3. **Error Tracking**: Log and analyze creation failures
4. **Usage Statistics**: Track admin usage patterns 