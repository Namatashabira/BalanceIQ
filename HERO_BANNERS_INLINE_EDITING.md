# Hero Banners - Advanced Inline Editing Guide

## Overview

The hero banner components now feature advanced inline editing capabilities with a floating toolbar, collapsible settings panel, and real-time text styling options.

## Key Features

### 1. **Inline Text Editing**
- Select any text directly on the hero banner
- Floating toolbar appears with styling options
- Real-time preview of changes
- Support for bold, italic, and custom colors

### 2. **Collapsible Settings Panel**
- Click "Settings" to expand/collapse
- Organized by sections (Headline, Subheadline, Buttons, etc.)
- Smooth animations
- Scrollable for many options

### 3. **Font Size Control**
- Range from 8px to 100px (like Word)
- Real-time slider adjustment
- Pixel display for precision
- Applied instantly to selected text

### 4. **Text Styling Options**
- **Bold**: Toggle bold on/off
- **Italic**: Toggle italic on/off
- **Color**: Full color picker with hex input
- **Background**: Optional background color

### 5. **Button Customization**
- Separate text and background colors
- Independent styling for each button
- Real-time preview

### 6. **Image Upload**
- Direct file upload for background images
- URL input as fallback
- Image preview in settings

## How to Use

### Editing Text Inline

1. **Select Text**
   - Click on any text in the hero banner
   - Highlight the text you want to edit
   - Floating toolbar appears above selection

2. **Apply Styles**
   - Adjust font size with slider (8-100px)
   - Click Bold/Italic buttons to toggle
   - Choose text color with color picker
   - Set background color if needed

3. **Close Toolbar**
   - Click "Done" button
   - Click elsewhere to dismiss
   - Changes apply immediately

### Using Settings Panel

1. **Open Settings**
   - Click "Settings" button below hero banner
   - Panel expands with all options

2. **Edit Content**
   - Modify text in textareas
   - Change colors with color pickers
   - Adjust font sizes with sliders

3. **Close Settings**
   - Click "Settings" again to collapse
   - Changes save automatically

### Editing Buttons

1. **Primary Button** (Marketing Hero)
   - Edit button text
   - Change text color
   - Change background color

2. **Secondary Button** (Marketing Hero)
   - Same options as primary button
   - Independent styling

3. **CTA Button** (Centered & Cover Hero)
   - Single button with full customization
   - Text and background colors

### Uploading Images

1. **Background Image** (Cover Banner)
   - Click "Upload" button in settings
   - Select image file from computer
   - Or paste image URL directly

2. **Product Image** (Marketing Hero)
   - Paste image URL in settings
   - Image loads automatically
   - Error handling with placeholder

## Component Structure

### MarketingHero

**Editable Elements**:
- Headline (text, font size, color, bold, italic)
- Subheadline (text, font size, color, bold, italic)
- Primary Button (text, text color, background color)
- Secondary Button (text, text color, background color)
- Product Image (URL)
- Background Color

**Default Styles**:
```javascript
{
  headline: { fontSize: 36, bold: false, italic: false, color: '#000000' },
  subheadline: { fontSize: 18, bold: false, italic: false, color: '#666666' },
  primaryBtnColor: '#3b82f6',
  primaryBtnBg: '#ffffff',
  secondaryBtnColor: '#000000',
  secondaryBtnBg: '#f3f4f6',
}
```

### CenteredHero

**Editable Elements**:
- Tag (text, color, background color)
- Headline (text, font size, color, bold, italic)
- Description (text, font size, color, bold, italic)
- CTA Button (text, text color, background color)
- Dashboard Image (URL)
- Background Color

**Default Styles**:
```javascript
{
  tag: { fontSize: 14, color: '#3b82f6' },
  headline: { fontSize: 48, bold: false, italic: false, color: '#000000' },
  description: { fontSize: 18, bold: false, italic: false, color: '#666666' },
  ctaBtnColor: '#ffffff',
  ctaBtnBg: '#3b82f6',
}
```

### CoverBanner

**Editable Elements**:
- Headline (text, font size, color, bold, italic)
- Subheadline (text, font size, color, bold, italic)
- CTA Button (text, text color, background color)
- Background Image (upload or URL)
- Overlay Color & Opacity
- Text Alignment (left, center, right)
- Min Height (small, medium, large)

**Default Styles**:
```javascript
{
  headline: { fontSize: 48, bold: false, italic: false, color: '#ffffff' },
  subheadline: { fontSize: 20, bold: false, italic: false, color: '#ffffff' },
  ctaBtnColor: '#000000',
  ctaBtnBg: '#ffffff',
  overlayOpacity: 0.5,
  overlayColor: '#000000',
}
```

## Floating Toolbar

### Position
- Appears above selected text
- Follows selection position
- Stays within viewport

### Controls
- **Font Size Slider**: 8-100px range
- **Bold Button**: Toggle bold styling
- **Italic Button**: Toggle italic styling
- **Text Color**: Color picker + hex input
- **Background Color**: Color picker + hex input
- **Done Button**: Close toolbar

### Keyboard Support
- Press Escape to close
- Tab to navigate controls
- Enter to apply changes

## Settings Panel

### Organization
- **Headline Section**: Text, font size, color
- **Subheadline Section**: Text, font size, color
- **Button Sections**: Text, colors
- **Image Section**: URL input
- **Overlay Section**: Color, opacity (Cover Banner)
- **Layout Section**: Alignment, height (Cover Banner)

### Scrollable
- Max height with scroll
- Prevents page overflow
- Smooth scrolling

## Text Styling

### Font Size
- Range: 8px to 100px
- Slider for quick adjustment
- Direct input for precision
- Real-time preview

### Font Weight
- **Bold**: On/Off toggle
- Applied to entire text block
- Visual feedback in toolbar

### Font Style
- **Italic**: On/Off toggle
- Applied to entire text block
- Visual feedback in toolbar

### Colors
- **Text Color**: Full RGB color picker
- **Background Color**: Optional background
- Hex input for exact colors
- Color preview in picker

## Button Customization

### Text Color
- Independent for each button
- Full color picker
- Hex input support

### Background Color
- Independent for each button
- Full color picker
- Hex input support

### Hover Effects
- Opacity change on hover
- Smooth transitions
- Visual feedback

## Image Management

### Upload
- Click "Upload" button
- Select image from computer
- Automatic base64 encoding
- Instant preview

### URL Input
- Paste image URL directly
- Supports external URLs
- Error handling with placeholder
- Fallback image on error

### Preview
- Real-time preview in canvas
- Thumbnail in settings
- Error state handling

## Overlay Control (Cover Banner)

### Color Selection
- Full color picker
- Hex input
- Default: Black (#000000)

### Opacity
- Range: 0% to 100%
- Slider control
- Real-time preview
- Percentage display

### Use Cases
- Improve text readability
- Create visual hierarchy
- Add depth to design

## Layout Options (Cover Banner)

### Text Alignment
- **Left**: Text aligned to left
- **Center**: Text centered (default)
- **Right**: Text aligned to right

### Height Options
- **Small**: min-h-64 (256px)
- **Medium**: min-h-96 (384px)
- **Large**: min-h-screen (100vh)

## Responsive Behavior

### Desktop
- Full layout displayed
- All controls accessible
- Floating toolbar positioned correctly

### Tablet
- Responsive grid adjusts
- Touch-friendly controls
- Toolbar positioned for touch

### Mobile
- Single column layout
- Stacked elements
- Optimized toolbar positioning

## Accessibility

### Keyboard Navigation
- Tab through controls
- Enter to activate buttons
- Escape to close toolbar
- Arrow keys for sliders

### Screen Readers
- Semantic HTML
- ARIA labels on buttons
- Form labels for inputs
- Color picker descriptions

### Color Contrast
- Text readable on backgrounds
- Sufficient contrast ratios
- WCAG AA compliance

## Performance

### Optimization
- Efficient re-renders
- Debounced updates
- Smooth animations
- Minimal DOM manipulation

### File Size
- Lightweight components
- No external dependencies
- Optimized CSS
- Minimal JavaScript

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers

## Troubleshooting

### Toolbar Not Appearing
- Ensure text is selected
- Check browser console for errors
- Try selecting different text

### Styles Not Applying
- Verify color format (hex)
- Check font size range (8-100)
- Ensure settings panel is open

### Image Not Loading
- Verify image URL is correct
- Check CORS settings
- Try uploading instead

### Settings Panel Not Opening
- Click "Settings" button
- Check for JavaScript errors
- Try refreshing page

## Tips & Tricks

### Efficient Editing
1. Use inline editing for quick changes
2. Use settings panel for detailed control
3. Preview changes in real-time
4. Use color picker for consistency

### Design Best Practices
1. Keep font sizes readable (16-48px)
2. Maintain color contrast
3. Use consistent spacing
4. Test on mobile devices

### Performance Tips
1. Optimize images before upload
2. Use web-safe colors
3. Avoid excessive styling
4. Test in different browsers

## Advanced Features

### Text Formatting
- Bold and italic combinations
- Multiple color options
- Background highlighting
- Font size variations

### Button Styling
- Independent color control
- Hover effects
- Responsive sizing
- Accessibility support

### Image Handling
- Upload support
- URL input
- Error handling
- Responsive sizing

## Future Enhancements

1. **Text Effects**
   - Underline option
   - Strikethrough
   - Text shadow
   - Letter spacing

2. **Advanced Colors**
   - Gradient support
   - Color presets
   - Recent colors
   - Accessibility checker

3. **Typography**
   - Font family selection
   - Line height control
   - Letter spacing
   - Text transform

4. **Animation**
   - Fade-in effects
   - Slide animations
   - Parallax scrolling
   - Hover animations

## File Structure

```
frontend/src/components/WebsiteBuilder/
├── MarketingHero.jsx (Updated)
├── CenteredHero.jsx (Updated)
├── CoverBanner.jsx (Updated)
├── TextEditorToolbar.jsx (New)
└── HeroBanners.js
```

## Export

```javascript
export { default as MarketingHero } from './MarketingHero';
export { default as CenteredHero } from './CenteredHero';
export { default as CoverBanner } from './CoverBanner';
export { default as TextEditorToolbar } from './TextEditorToolbar';
```

---

**Version**: 2.0 (Advanced Inline Editing)
**Status**: Production Ready ✅
**Last Updated**: 2024
