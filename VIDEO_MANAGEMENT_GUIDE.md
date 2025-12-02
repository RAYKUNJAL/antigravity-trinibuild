# Video Management System - Admin Dashboard

## Overview
A comprehensive video placement management system has been added to the TriniBuild Admin Dashboard, giving you full control over video placements across all pages and sections of your platform.

## Features Implemented

### 1. **Video Placement Manager** (New Admin Tab)
- Dedicated "Video Manager" section in the admin sidebar
- Organize videos by page (Home, Stores, Rides, Drive, Jobs, Real Estate, Tickets, Legal, About)
- Control video placement in specific sections (hero, features, testimonials, etc.)
- Visual preview of all video placements

### 2. **Full Video Controls**
- **Page Selection**: Choose which page to place the video on
- **Section Selection**: Select specific section within the page (hero, features, etc.)
- **Video URL**: Support for both YouTube embeds and direct video files
- **Video Upload**: Direct upload capability for video files
- **Playback Options**:
  - Autoplay (on/off)
  - Loop (on/off)
  - Muted (on/off)
  - Show Controls (on/off)
- **Position**: Set display order when multiple videos exist
- **Active/Inactive**: Toggle video visibility

### 3. **Visual Management**
- Video preview thumbnails in the dashboard
- Live preview in the modal before saving
- Edit/Delete buttons for each video placement
- Status badges showing autoplay, loop, muted states
- Organized by page with quick "Add to Page" buttons

## Files Created/Modified

### New Files:
1. **`services/videoService.ts`**
   - Video placement CRUD operations
   - Supabase integration for video data
   - Video upload functionality
   - Page and section definitions

2. **`components/VideoPlacementModal.tsx`**
   - Reusable modal component for adding/editing videos
   - Full form with all video options
   - Live preview functionality

3. **`supabase/migrations/09_video_placements.sql`**
   - Database table for video placements
   - RLS policies for security
   - Indexes for performance

### Modified Files:
1. **`pages/AdminDashboard.tsx`**
   - Added "Video Manager" tab to sidebar
   - Integrated video management UI
   - Added video state management and handlers

## Database Schema

```sql
video_placements (
    id UUID PRIMARY KEY,
    page TEXT NOT NULL,
    section TEXT NOT NULL,
    video_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    autoplay BOOLEAN DEFAULT false,
    loop BOOLEAN DEFAULT false,
    muted BOOLEAN DEFAULT true,
    controls BOOLEAN DEFAULT true,
    position INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
```

## Available Pages
- Home Page
- Stores/Marketplace
- Rides
- Drive With Us
- Jobs Board
- Real Estate
- Events & Tickets
- Legal Services
- About Us

## Available Sections (per page)
- **Home**: hero, features, testimonials, cta
- **Stores**: hero, featured, categories
- **Rides**: hero, how-it-works, safety
- **Drive**: hero, benefits, requirements
- **Jobs**: hero, featured-jobs
- **Real Estate**: hero, featured-properties
- **Tickets**: hero, upcoming-events
- **Legal**: hero, services
- **About**: hero, team, mission

## How to Use

### 1. **Access Video Manager**
- Log into Admin Dashboard
- Click "Video Manager" in the sidebar

### 2. **Add a Video**
- Click "Add Video Placement" (top right)
- OR click "+ Add to [Page Name]" on any page card

### 3. **Configure Video**
- Select page and section
- Enter YouTube embed URL or upload video file
- Add title and description
- Set position (order)
- Configure playback options (autoplay, loop, muted, controls)
- Toggle active/inactive
- Preview the video
- Click "Save Placement"

### 4. **Edit/Delete Videos**
- Click the edit icon (pencil) to modify
- Click the X icon to delete

## Next Steps

### Required:
1. **Run the SQL Migration**
   - Open Supabase SQL Editor
   - Copy content from `supabase/migrations/09_video_placements.sql`
   - Execute the SQL to create the table

### Optional Enhancements:
1. **Frontend Integration**
   - Add video rendering components to each page
   - Fetch videos using `videoService.getVideosByPage(pageName)`
   - Display videos in the appropriate sections

2. **Analytics**
   - Track video views
   - Monitor engagement metrics
   - A/B testing different video placements

3. **Advanced Features**
   - Video scheduling (start/end dates)
   - Geo-targeting (show different videos by location)
   - User role targeting (different videos for logged-in users)
   - Video playlists

## Example Usage in Frontend

```typescript
import { videoService } from '../services/videoService';

// In your page component
const [videos, setVideos] = useState([]);

useEffect(() => {
    const loadVideos = async () => {
        const pageVideos = await videoService.getVideosByPage('home');
        setVideos(pageVideos);
    };
    loadVideos();
}, []);

// Render videos
{videos.map(video => (
    <div key={video.id}>
        {video.video_url.includes('youtube') ? (
            <iframe src={video.video_url} />
        ) : (
            <video 
                src={video.video_url}
                autoPlay={video.autoplay}
                loop={video.loop}
                muted={video.muted}
                controls={video.controls}
            />
        )}
    </div>
))}
```

## Security
- Row Level Security (RLS) enabled
- Public can view active videos
- Only authenticated users can manage videos
- All uploads go to secure Supabase storage

## Performance
- Indexed by page for fast queries
- Lazy loading of video content
- Optimized for mobile viewing

---

**Status**: ✅ Complete and ready to use
**Last Updated**: December 1, 2025
