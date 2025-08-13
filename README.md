# Leadership Assessment Website

A professional leadership assessment platform designed specifically for Pakistan's pharmaceutical industry. This comprehensive tool evaluates leadership styles based on Daniel Goleman's six leadership approaches.

## Features

### 🎯 Core Assessment System
- **200 Leadership Statements**: Comprehensive database covering all 6 Goleman leadership styles
- **25 Random Questions**: Each user receives a unique set of contextually relevant statements
- **Pakistani Pharma Context**: All scenarios tailored to pharmaceutical sales and marketing challenges in Pakistan
- **Detailed Statements**: Each statement contains 50+ words for comprehensive context

### 🏆 Six Leadership Styles Evaluated
1. **Coercive** - Directive, commanding approach
2. **Authoritative** - Visionary, inspiring leadership  
3. **Affiliative** - People-focused, harmony-building
4. **Democratic** - Collaborative, consensus-building
5. **Pacesetting** - High-performance, lead-by-example
6. **Coaching** - Development-focused, mentoring approach

### 🎨 Professional Design
- **Glassmorphic UI**: Modern, elegant design with smooth animations
- **Responsive Layout**: Optimized for all devices and screen sizes
- **Animated Logos**: Beautiful company branding with glow effects
- **Smooth Transitions**: Elegant page transitions and micro-interactions

### 📊 Comprehensive Results
- **Primary Leadership Style**: Identified with percentage score
- **Complete Profile**: Detailed breakdown of all six leadership styles
- **Personalized Feedback**: Encouragement messages and development tips
- **Professional Certificate**: Print-ready certificate with company branding

### 💾 Data Management
- **Supabase Integration**: Secure cloud database storage
- **User Persistence**: Returning users go directly to assessment
- **Progress Tracking**: Visual progress indicators during assessment
- **No Repetition**: Intelligent question selection prevents duplicates

## Setup Instructions

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to the SQL Editor
3. Run the SQL commands from `supabase-setup.sql` to create the database schema
4. Get your project URL and anon key from Settings > API

### 2. Configure the Application

1. Open `script.js`
2. Replace the placeholder values with your Supabase credentials:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

### 3. Deploy

This is a static website that can be deployed to any web hosting service:
- **Netlify**: Drag and drop the files to Netlify
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Enable Pages in your repository settings
- **Any web server**: Upload all files to your web directory

## File Structure

```
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── script.js           # Application logic and Supabase integration
├── statements.js       # 200 leadership statements database
├── supabase-setup.sql  # Database schema setup
└── README.md          # This file
```

## Database Schema

The application uses a single table `leadership_assessments` with the following fields:

- `id`: Unique identifier
- `full_name`: Participant's full name (unique)
- `city`: Participant's city
- `team`: Participant's team
- `designation`: Participant's designation
- `primary_style`: Dominant leadership style
- `*_score`: Individual scores for each leadership style (0-100)
- `assessment_completed`: Boolean flag
- `completed_at`: Completion timestamp
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

## User Experience Flow

1. **Landing Page**: User enters personal information
2. **Assessment**: 25 randomized questions with progress tracking
3. **Results**: Comprehensive analysis with primary style and complete profile
4. **Certificate**: Professional, printable certificate
5. **Persistence**: Returning users skip to results if already completed

## Customization

### Adding New Statements
Edit `statements.js` to add new leadership statements. Each statement should include:
- Unique `id`
- Detailed `text` (50+ words)
- Associated leadership `style`

### Styling Changes
Modify `styles.css` to customize:
- Color schemes
- Typography
- Animations
- Layout adjustments

### Branding Updates
Update company information in:
- Logo text in HTML
- Certificate content
- Footer attribution

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Notes

- The current setup allows public access to the assessment
- For production use, consider implementing user authentication
- Review and adjust Row Level Security policies as needed
- Consider rate limiting for API calls

## Support

For technical support or customization requests, please refer to:
- Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
- JavaScript documentation: [developer.mozilla.org](https://developer.mozilla.org)

---

**Certificate Attribution**: Certificate is presented from STAR-Shaigan Learning Portal, Zubair Ahmad Senior SFE Manager