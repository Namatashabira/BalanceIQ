# Hero Banner Components - Complete Documentation

## Overview

Three professional, reusable hero banner components for the Website Builder with full editing capabilities. Each component is fully responsive, modern, and designed for SaaS and e-commerce websites.

## Components

### 1. Marketing Hero (Two-Column Layout)

**File**: `MarketingHero.jsx`

**Purpose**: Professional marketing hero with text on left and image on right

**Layout**:
- Left column: Headline, subheadline, two CTA buttons
- Right column: Hero image/product illustration
- Responsive: Stacks on mobile

**Editable Properties**:
- Headline (text)
- Headline size (Small/Medium/Large/Extra Large)
- Subheadline (text)
- Primary button text
- Secondary button text
- Image URL
- Background color (with color picker)
- Text color (with color picker)

**Default Data**:
```javascript
{
  headline: 'Grow Your Business',
  subheadline: 'The all-in-one platform for modern teams',
  primaryBtnText: 'Get Started',
  primaryBtnUrl: '#',
  secondaryBtnText: 'Learn More',
  secondaryBtnUrl: '#',
  imageUrl: 'https://via.placeholder.com/500x400?text=Product+Image',
  imageAlt: 'Product Image',
  bgColor: '#ffffff',
  textColor: '#000000',
  headlineSize: 'text-4xl',
  subheadlineSize: 'text-lg',
}
```

**Usage**:
```jsx
<MarketingHero
  id="hero-1"
  isSelected={true}
  onSelect={() => handleSelect()}
  onDelete={() => handleDelete()}
  onDuplicate={() => handleDuplicate()}
  onUpdate={(data) => handleUpdate(data)}
  data={heroData}
/>
```

**Features**:
- ✅ Two-column responsive layout
- ✅ Customizable headline and subheadline
- ✅ Two CTA buttons with different styles
- ✅ Image support with error handling
- ✅ Color customization
- ✅ Font size options
- ✅ Edit/Delete/Duplicate controls

---

### 2. Centered SaaS Hero (Landing Page Style)

**File**: `CenteredHero.jsx`

**Purpose**: Centered hero section for SaaS landing pages

**Layout**:
- Tag/label above headline
- Large centered headline
- Description text
- Single CTA button
- Product screenshot/illustration below

**Editable Properties**:
- Tag text
- Tag color (with color picker)
- Headline (text)
- Headline size (Small/Medium/Large/Extra Large)
- Description (text)
- CTA button text
- Image URL
- Background color (with color picker)
- Text color (with color picker)

**Default Data**:
```javascript
{
  tag: 'New Feature',
  headline: 'Build Faster Than Ever',
  description: 'The modern platform for teams that want to ship faster',
  ctaText: 'Start Free Trial',
  ctaUrl: '#',
  imageUrl: 'https://via.placeholder.com/600x400?text=Dashboard',
  imageAlt: 'Dashboard Screenshot',
  bgColor: '#ffffff',
  textColor: '#000000',
  tagColor: '#3b82f6',
  headlineSize: 'text-5xl',
}
```

**Usage**:
```jsx
<CenteredHero
  id="hero-2"
  isSelected={true}
  onSelect={() => handleSelect()}
  onDelete={() => handleDelete()}
  onDuplicate={() => handleDuplicate()}
  onUpdate={(data) => handleUpdate(data)}
  data={heroData}
/>
```

**Features**:
- ✅ Fully centered layout
- ✅ Tag/badge support
- ✅ Large headline with size options
- ✅ Description text
- ✅ Single prominent CTA button
- ✅ Dashboard screenshot support
- ✅ Color customization
- ✅ Edit/Delete/Duplicate controls

---

### 3. Cover Banner (Full-Width Image Hero)

**File**: `CoverBanner.jsx`

**Purpose**: Full-width hero with background image and overlay

**Layout**:
- Full-width background image
- Dark overlay for readability
- Headline and subtext
- Single CTA button
- Configurable text alignment

**Editable Properties**:
- Background image (with upload support)
- Headline (text)
- Headline size (Small/Medium/Large/Extra Large)
- Subheadline (text)
- CTA button text
- Text alignment (Left/Center/Right)
- Min height (Small/Medium/Large)
- Text color (with color picker)
- Overlay color (with color picker)
- Overlay opacity (0-100%)

**Default Data**:
```javascript
{
  headline: 'Premium Quality Products',
  subheadline: 'Discover our exclusive collection',
  ctaText: 'Shop Now',
  ctaUrl: '#',
  backgroundImage: 'https://via.placeholder.com/1200x600?text=Cover+Banner',
  overlayOpacity: 0.5,
  overlayColor: '#000000',
  textColor: '#ffffff',
  textAlign: 'center',
  headlineSize: 'text-5xl',
  minHeight: 'min-h-96',
}
```

**Usage**:
```jsx
<CoverBanner
  id="hero-3"
  isSelected={true}
  onSelect={() => handleSelect()}
  onDelete={() => handleDelete()}
  onDuplicate={() => handleDuplicate()}
  onUpdate={(data) => handleUpdate(data)}
  data={heroData}
/>
```

**Features**:
- ✅ Full-width background image
- ✅ Image upload support
- ✅ Overlay with opacity control
- ✅ Text alignment options
- ✅ Configurable height
- ✅ Color customization
- ✅ Overlay opacity slider
- ✅ Edit/Delete/Duplicate controls

---

## Common Features

### All Components Include:

1. **Selection State**
   - Blue border when selected
   - Ring effect for visual feedback
   - Copy and delete buttons appear on selection

2. **Edit Panel**
   - Appears below component when selected
   - Real-time updates
   - Color pickers with hex input
   - Text inputs and textareas
   - Dropdown selectors

3. **Responsive Design**
   - Mobile-first approach
   - Tailwind CSS responsive classes
   - Stacks properly on small screens

4. **Accessibility**
   - Semantic HTML
   - Proper color contrast
   - Keyboard navigation support
   - ARIA labels on buttons

5. **Error Handling**
   - Image error fallback
   - Placeholder images
   - Graceful degradation

---

## Props Reference

### Common Props (All Components)

| Prop | Type | Description |
|------|------|-------------|
| `id` | string | Unique identifier |
| `isSelected` | boolean | Whether component is selected |
| `onSelect` | function | Callback when selected |
| `onDelete` | function | Callback to delete component |
| `onDuplicate` | function | Callback to duplicate component |
| `onUpdate` | function | Callback when data changes |
| `data` | object | Component data/configuration |

### Data Object Structure

**MarketingHero Data**:
```javascript
{
  headline: string,
  subheadline: string,
  primaryBtnText: string,
  primaryBtnUrl: string,
  secondaryBtnText: string,
  secondaryBtnUrl: string,
  imageUrl: string,
  imageAlt: string,
  bgColor: string (hex),
  textColor: string (hex),
  headlineSize: string (Tailwind class),
  subheadlineSize: string (Tailwind class),
}
```

**CenteredHero Data**:
```javascript
{
  tag: string,
  headline: string,
  description: string,
  ctaText: string,
  ctaUrl: string,
  imageUrl: string,
  imageAlt: string,
  bgColor: string (hex),
  textColor: string (hex),
  tagColor: string (hex),
  headlineSize: string (Tailwind class),
}
```

**CoverBanner Data**:
```javascript
{
  headline: string,
  subheadline: string,
  ctaText: string,
  ctaUrl: string,
  backgroundImage: string (URL or base64),
  overlayOpacity: number (0-1),
  overlayColor: string (hex),
  textColor: string (hex),
  textAlign: string ('left' | 'center' | 'right'),
  headlineSize: string (Tailwind class),
  minHeight: string (Tailwind class),
}
```

---

## Integration with Website Builder

### Adding to Blocks

Hero banners are available in the "Blocks" tab of the left sidebar:

1. **Marketing Hero** - Two-column layout
2. **Centered SaaS Hero** - Centered landing page style
3. **Cover Banner** - Full-width image hero

### Drag & Drop

1. Open Website Builder
2. Click "Blocks" tab in left sidebar
3. Drag desired hero banner to canvas
4. Click to select and edit
5. Modify properties in edit panel

### Editing

When selected, each hero banner shows:
- Copy button (duplicate)
- Delete button (remove)
- Edit panel with all customizable properties

---

## Styling

### Tailwind CSS Classes Used

- `grid grid-cols-1 md:grid-cols-2` - Responsive grid
- `text-3xl` to `text-7xl` - Headline sizes
- `bg-blue-600 hover:bg-blue-700` - Button styling
- `rounded-lg shadow-lg` - Rounded corners and shadows
- `transition` - Smooth animations
- `border-2 border-blue-500` - Selection border

### Color System

- **Primary**: Blue (#3b82f6)
- **Text**: Dark gray (#000000) or white (#ffffff)
- **Background**: White (#ffffff) or custom
- **Overlay**: Black (#000000) with opacity

---

## Examples

### Example 1: Marketing Hero

```jsx
const marketingHeroData = {
  headline: 'Grow Your Business',
  subheadline: 'The all-in-one platform for modern teams',
  primaryBtnText: 'Get Started',
  secondaryBtnText: 'Learn More',
  imageUrl: 'https://example.com/product.jpg',
  bgColor: '#ffffff',
  textColor: '#000000',
  headlineSize: 'text-4xl',
};

<MarketingHero
  id="marketing-1"
  isSelected={false}
  onSelect={() => console.log('Selected')}
  onDelete={() => console.log('Deleted')}
  onDuplicate={() => console.log('Duplicated')}
  onUpdate={(data) => console.log('Updated', data)}
  data={marketingHeroData}
/>
```

### Example 2: Centered Hero

```jsx
const centeredHeroData = {
  tag: 'New Feature',
  headline: 'Build Faster Than Ever',
  description: 'The modern platform for teams',
  ctaText: 'Start Free Trial',
  imageUrl: 'https://example.com/dashboard.jpg',
  tagColor: '#3b82f6',
  headlineSize: 'text-5xl',
};

<CenteredHero
  id="centered-1"
  isSelected={true}
  onSelect={() => console.log('Selected')}
  onDelete={() => console.log('Deleted')}
  onDuplicate={() => console.log('Duplicated')}
  onUpdate={(data) => console.log('Updated', data)}
  data={centeredHeroData}
/>
```

### Example 3: Cover Banner

```jsx
const coverBannerData = {
  headline: 'Premium Quality Products',
  subheadline: 'Discover our exclusive collection',
  ctaText: 'Shop Now',
  backgroundImage: 'https://example.com/banner.jpg',
  overlayOpacity: 0.5,
  overlayColor: '#000000',
  textColor: '#ffffff',
  textAlign: 'center',
  minHeight: 'min-h-96',
};

<CoverBanner
  id="cover-1"
  isSelected={true}
  onSelect={() => console.log('Selected')}
  onDelete={() => console.log('Deleted')}
  onDuplicate={() => console.log('Duplicated')}
  onUpdate={(data) => console.log('Updated', data)}
  data={coverBannerData}
/>
```

---

## Responsive Behavior

### Desktop (1024px+)
- Full layout displayed
- Two-column layout for Marketing Hero
- Centered layout for Centered Hero
- Full-width for Cover Banner

### Tablet (768px - 1023px)
- Adjusted spacing
- Responsive grid
- Optimized button sizes

### Mobile (< 768px)
- Single column layout
- Stacked elements
- Optimized font sizes
- Touch-friendly buttons

---

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers

---

## Performance

- Lightweight components
- Efficient re-renders
- Optimized images
- Smooth animations
- No external dependencies (except React & Tailwind)

---

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Color contrast compliance
- Keyboard navigation support
- ARIA labels on interactive elements
- Image alt text support

---

## Future Enhancements

1. **Animation Effects**
   - Fade-in animations
   - Parallax scrolling
   - Slide transitions

2. **Advanced Styling**
   - Custom CSS editor
   - Font family selection
   - Border radius control

3. **Content Options**
   - Video background support
   - Multiple image support
   - Rich text editor

4. **Analytics**
   - Click tracking
   - Conversion tracking
   - A/B testing

---

## Troubleshooting

### Image Not Loading
- Check image URL is valid
- Verify CORS settings
- Use placeholder image

### Colors Not Updating
- Ensure hex format is correct (#RRGGBB)
- Check color picker is working
- Verify onUpdate callback

### Text Not Visible
- Check text color vs background
- Adjust overlay opacity
- Verify font size

---

## File Structure

```
frontend/src/components/WebsiteBuilder/
├── MarketingHero.jsx
├── CenteredHero.jsx
├── CoverBanner.jsx
└── HeroBanners.js (index file)
```

---

## Export

All components are exported from `HeroBanners.js`:

```javascript
export { default as MarketingHero } from './MarketingHero';
export { default as CenteredHero } from './CenteredHero';
export { default as CoverBanner } from './CoverBanner';
```

---

**Version**: 1.0
**Status**: Production Ready ✅
**Last Updated**: 2024
