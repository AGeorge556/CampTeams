# CampTeams - Summer Camp Team Selection Platform

A modern web application for managing summer camp team assignments, built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure signup/signin with email confirmation
- **Team Management**: 4-color team system (Red, Blue, Green, Yellow)
- **Grade-based Limits**: Maximum 4 players per grade per team
- **Team Switching**: Users can switch teams up to 3 times

- **Real-time Updates**: Live team roster updates using Supabase subscriptions

### Admin Features
- **Admin Panel**: Comprehensive team management interface
- **User Management**: View all users, reassign teams, export data
- **Camp Settings**: Lock/unlock teams, set team size limits
- **Schedule Management**: Edit 4-day camp schedule with tabbed interface
- **Sports Selection**: Manage teen sports preferences

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Smooth loading indicators throughout the app
- **Toast Notifications**: Real-time feedback for user actions

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel-ready

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CampTeams
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the SQL migrations in `supabase/migrations/` in order:
     - `20250710122447_golden_union.sql`
     - `20250710123751_wild_math.sql`
     - `20250710130000_add_schedule_and_sports.sql`
     - `20250710131000_update_grade_system.sql`

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

### Tables
- **profiles**: User profiles with team assignments
- **team_switches**: History of team switches
- **camp_settings**: Global camp configuration
- **camp_schedule**: 4-day camp schedule
- **user_sport_selections**: User sports preferences

### Key Features
- Row Level Security (RLS) enabled on all tables
- Real-time subscriptions for live updates
- Grade-based team limits (max 4 per grade)
- Team switching validation with remaining switches tracking

## 🎨 Component Architecture

### Core Components
- `App.tsx`: Main application with routing and providers
- `LandingPage.tsx`: Public landing page with countdown
- `Auth.tsx`: Authentication forms with validation
- `OnboardingForm.tsx`: User profile creation
- `Dashboard.tsx`: Main user dashboard
- `PlayerLists.tsx`: Team roster display
- `Schedule.tsx`: Camp schedule with admin editing
- `SportsSelection.tsx`: Sports preference management
- `AdminPanel.tsx`: Admin interface

### UI Components
- `Button.tsx`: Reusable button with variants
- `Input.tsx`: Form input with validation states
- `LoadingSpinner.tsx`: Loading indicators
- `Toast.tsx`: Notification system
- `ErrorBoundary.tsx`: Error handling

### Hooks
- `useAuth.ts`: Authentication state management
- `useProfile.ts`: User profile management
- `usePlayers.ts`: Team roster data with real-time updates
- `useTeamBalance.ts`: Team statistics and balance

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality
- ESLint configuration with TypeScript and React rules
- Consistent code formatting with Prettier
- TypeScript strict mode enabled
- Component prop validation with TypeScript interfaces

### Performance Optimizations
- React.memo for expensive components
- useMemo and useCallback for expensive calculations
- Lazy loading of components where appropriate
- Optimized re-renders with proper dependency arrays

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **Input Validation**: Client and server-side validation
- **Error Boundaries**: Graceful error handling
- **Rate Limiting**: Built-in rate limiting for auth operations
- **XSS Protection**: Proper input sanitization

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface
- Optimized for various screen sizes

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast color scheme
- Screen reader compatibility
- Focus management

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and authentication
- [ ] Profile creation and editing
- [ ] Team switching functionality
- [ ] Admin panel features
- [ ] Schedule editing
- [ ] Sports selection
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Real-time updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support or questions:
- Create an issue in the GitHub repository
- Check the documentation in the code comments
- Review the database schema and migrations

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete team management system
- Admin panel with full functionality
- Real-time updates
- Mobile-responsive design
- Comprehensive error handling 