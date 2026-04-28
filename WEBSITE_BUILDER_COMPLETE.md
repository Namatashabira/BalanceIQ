# Website Builder - Complete Documentation

## Overview
A professional drag-and-drop website builder with live preview, collapsible sidebars, and pre-built blocks - similar to Odoo's website builder interface.

## Key Features

### 1. **Live Preview Canvas**
- Real-time visual editing as you build
- WYSIWYG (What You See Is What You Get) interface
- Professional white canvas with shadow effects
- Responsive preview of all elements
- Element count indicator

### 2. **Collapsible Left Sidebar**
- **Components Tab**: Individual building blocks
  - Text
  - Image
  - Button
  - Product
  - Grid
  - Section
- **Blocks Tab**: Pre-built section templates
  - Hero Section
  - Features
  - Products Grid
  - Testimonials
  - Call to Action
  - Footer
- Smooth collapse/expand animation
- Drag-and-drop from both tabs

### 3. **Collapsible Right Sidebar**
- Settings panel for selected elements
- Collapses to a thin button when closed
- Properties include:
  - Content editing
  - Background color (with color picker)
  - Text color (with color picker)
  - Padding control
  - Margin control
  - Width options (Full, Half, Third, Auto)
  - Text alignment (Left, Center, Right)
- Real-time updates

### 4. **Canvas Editor**
- Central editing area
- Drag-and-drop zone
- Element selection with visual feedback
- Delete and duplicate buttons on each element
- Smooth transitions and hover effects
- Professional styling with shadows

### 5. **Header Controls**
- **Save**: Save website draft
- **Preview**: Open live preview in new window
- **Publish**: Publish website live
- **Undo/Redo**: Navigate through edit history
- **Reset**: Clear entire canvas

### 6. **Toolbar**
- Choose Template button
- E-commerce Settings button
- Integrations button
- Helpful tip display

## Component Architecture

```
WebsiteBuilder (Main Page)
├── Header
│   ├── Save button
│   ├── Preview button
│   ├── Publish button
│   ├── Undo/Redo buttons
│   └── Reset button
├── Toolbar
│   ├── Choose Template
│   ├── E-commerce Settings
│   └── Integrations
└── BuilderWorkspace
    ├── LeftSidebar (Collapsible)
    │   ├── Components Tab
    │   └── Blocks Tab
    ├── CanvasEditor (Main)
    │   ├── Canvas
    │   └── Elements
    └── RightSidebar (Collapsible)
        └── Settings Panel
```

## Element Types

### Text
- Editable content
- Customizable colors and padding
- Text alignment options

### Image
- Image URL input
- Preview in canvas
- Customizable dimensions

### Button
- Clickable button element
- Customizable text and colors
- Hover effects

### Product
- Product card display
- Image placeholder
- Price display
- Add to cart button

### Section
- Container element
- Background color customization
- Minimum height for content

### Grid
- 3-column layout
- Responsive design
- Column placeholders

## Block Templates

### Hero Section
- Large background section
- Welcome text
- Call-to-action button
- Dark background

### Features
- Features section header
- 3-column grid layout

### Products Grid
- Products section
- 4-product grid
- Product cards with pricing

### Testimonials
- Testimonials header
- Customer feedback text

### Call to Action
- CTA section with blue background
- Heading text
- Action button

### Footer
- Footer section
- Copyright text
- Dark background

## Usage Guide

### Building a Website

1. **Start with a Template** (Optional)
   - Click "Choose Template"
   - Select a pre-built template
   - Template loads with pre-configured sections

2. **Add Components**
   - Open Left Sidebar (if closed)
   - Click "Components" tab
   - Drag components to canvas
   - Click to select and edit

3. **Add Blocks**
   - Click "Blocks" tab in Left Sidebar
   - Drag entire block sections to canvas
   - Blocks add multiple elements at once

4. **Edit Elements**
   - Click element on canvas to select
   - Open Right Sidebar (if closed)
   - Modify properties in settings panel
   - Changes apply in real-time

5. **Manage Elements**
   - **Duplicate**: Click copy icon on selected element
   - **Delete**: Click trash icon on selected element
   - **Reorder**: Drag elements on canvas (future feature)

6. **Save & Publish**
   - Click "Save" to save draft
   - Click "Preview" to see live preview
   - Click "Publish" to go live

### Keyboard Shortcuts (Future)
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Delete` - Delete selected element
- `Ctrl+D` - Duplicate selected element

## Styling System

### Colors
- Background colors with hex input and color picker
- Text colors with hex input and color picker
- Predefined color palette (future)

### Spacing
- Padding: 0-50px
- Margin: 0-50px
- Customizable for each element

### Layout
- Full width
- Half width
- One third width
- Auto width

### Text
- Left alignment
- Center alignment
- Right alignment

## E-commerce Integration

### Features
- Product selection from inventory
- Multi-select products
- Display products on website
- Connected to backend API
- Real-time product data

### Settings
- Choose which products to display
- Customize product cards
- Set pricing display
- Configure add-to-cart buttons

## System Integrations

### Inventory System
- Status: Connected
- Sync product stock levels
- Real-time inventory updates

### Sales Tracking
- Status: Connected
- Track orders from website
- Revenue reporting

### Accounting
- Status: Disconnected
- Financial data integration
- Connect/disconnect buttons

## File Structure

```
frontend/src/
├── components/WebsiteBuilder/
│   ├── Header.jsx (Updated)
│   ├── TemplateGallery.jsx
│   ├── LeftSidebar.jsx (Updated)
│   ├── CanvasEditor.jsx (Updated)
│   ├── RightSidebar.jsx (Updated)
│   ├── BuilderWorkspace.jsx (Updated)
│   ├── EcommerceSettings.jsx
│   └── IntegrationPanel.jsx
├── pages/WebsiteBuilder/
│   └── WebsiteBuilder.jsx (Updated)
└── config/
    └── navigationConfig.js (Updated)
```

## API Endpoints Used

- `GET /api/core/products/` - Fetch products for e-commerce settings

## Feature Flags

Enable in backend:
```
website_builder_enabled: true
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive)

## Performance Optimizations

- Lazy loading for large canvases
- Efficient re-renders with React hooks
- Smooth animations with CSS transitions
- Optimized drag-and-drop handling

## Future Enhancements

1. **Advanced Features**
   - Keyboard shortcuts
   - Element reordering via drag
   - Undo/Redo history persistence
   - Auto-save functionality

2. **Design Features**
   - Custom CSS editor
   - Animation effects
   - Responsive breakpoints
   - Mobile preview

3. **Content Features**
   - SEO settings
   - Meta tags
   - Analytics integration
   - Form builder

4. **Collaboration**
   - Multi-user editing
   - Comments and feedback
   - Version history
   - Publish scheduling

5. **Advanced Integrations**
   - Email marketing
   - CRM integration
   - Payment gateway setup
   - Shipping configuration

## Troubleshooting

### Sidebar Not Showing
- Click the chevron button to toggle
- Check browser console for errors

### Elements Not Dragging
- Ensure drag-and-drop is enabled
- Try refreshing the page
- Check browser compatibility

### Settings Not Updating
- Ensure element is selected (blue border)
- Check that Right Sidebar is open
- Try clicking element again

### Preview Not Working
- Check browser popup blocker
- Ensure backend is running
- Verify API endpoints

## Support

For issues or questions:
1. Check this documentation
2. Review component code comments
3. Check browser console for errors
4. Contact development team

---

**Built with React, Tailwind CSS, and Lucide Icons**
