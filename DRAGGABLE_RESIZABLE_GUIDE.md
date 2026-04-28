# Draggable & Resizable Components - Implementation Guide

## Overview
All text, buttons, and images in hero banners are now fully draggable and resizable. Each component can be positioned independently anywhere on the canvas without affecting other elements.

## Features

### 1. **Drag & Drop**
- Click and drag any text, button, or image to move it anywhere on the hero banner
- Smooth cursor feedback (grab/grabbing)
- Visual drag handle appears on hover when editing
- Drag handle shows "Drag" label for clarity

### 2. **Resizing**
- Resize handle appears at bottom-right corner of each component
- Drag to stretch/shrink components independently
- Minimum size constraints prevent components from becoming too small
- Smooth resizing with visual feedback

### 3. **Independent Positioning**
- Each component maintains its own position and size
- Moving one component doesn't affect others
- Position data persists in component state
- All changes are saved to the data model

### 4. **Visual Feedback**
- Blue ring outline shows when component is selected for editing
- Drag handle appears on hover (only in edit mode)
- Resize handle appears on hover (only in edit mode)
- Smooth transitions between states

## Component Structure

### DraggableResizable Wrapper
Located at: `src/components/WebsiteBuilder/DraggableResizable.jsx`

**Props:**
```javascript
{
  id: string,                    // Unique identifier
  children: ReactNode,           // Content to wrap
  onPositionChange: function,    // Callback when position changes
  onSizeChange: function,        // Callback when size changes
  position: { x, y },           // Current position in pixels
  size: { width, height },      // Current size (px or 'auto')
  isEditing: boolean,           // Enable drag/resize when true
  minWidth: number,             // Minimum width in pixels
  minHeight: number,            // Minimum height in pixels
}
```

### Updated Hero Components

#### MarketingHero
- Headline: draggable & resizable
- Subheadline: draggable & resizable
- Primary Button: draggable & resizable
- Secondary Button: draggable & resizable
- Image: draggable & resizable

#### CenteredHero
- Tag: draggable & resizable
- Headline: draggable & resizable
- Description: draggable & resizable
- CTA Button: draggable & resizable
- Image: draggable & resizable

#### CoverBanner
- Headline: draggable & resizable
- Subheadline: draggable & resizable
- CTA Button: draggable & resizable

## Data Structure

Each hero banner now includes position and size data for every element:

```javascript
{
  // Text content
  headline: 'Grow Your Business',
  headlineStyles: { fontSize: 36, ... },
  headlinePosition: { x: 0, y: 0 },      // NEW
  headlineSize: { width: 'auto', height: 'auto' }, // NEW
  
  // Button
  primaryBtnText: 'Get Started',
  primaryBtnStyles: { ... },
  primaryBtnPosition: { x: 0, y: 140 },  // NEW
  primaryBtnSize: { width: 'auto', height: 'auto' }, // NEW
  
  // Image
  imageUrl: 'https://...',
  imagePosition: { x: 400, y: 0 },       // NEW
  imageSize: { width: 300, height: 250 }, // NEW
}
```

## Usage Example

### In Hero Component:
```jsx
<DraggableResizable
  id="headline"
  position={data.headlinePosition}
  size={data.headlineSize}
  onPositionChange={(pos) => handlePositionChange('headline', pos)}
  onSizeChange={(size) => handleSizeChange('headline', size)}
  isEditing={isSelected}
  minWidth={100}
  minHeight={30}
>
  <EditableText
    content={data.headline}
    onChange={(value) => handleChange('headline', value)}
    onStyleChange={(styles) => handleStyleChange('headline', styles)}
    styles={data.headlineStyles}
    isEditing={isSelected}
  />
</DraggableResizable>
```

### Handler Functions:
```jsx
const handlePositionChange = (field, position) => {
  handleChange(`${field}Position`, position);
};

const handleSizeChange = (field, size) => {
  handleChange(`${field}Size`, size);
};
```

## Interaction Flow

### Editing Mode (isSelected = true)
1. Hover over component → Drag handle appears
2. Click and drag → Component moves smoothly
3. Hover bottom-right → Resize handle appears
4. Click and drag resize handle → Component resizes
5. All changes update in real-time

### View Mode (isSelected = false)
- Components are fixed in their positions
- No drag/resize handles visible
- Clean, professional appearance

## Technical Details

### Drag Implementation
- Uses `onMouseDown` to start drag
- Tracks `mousemove` events globally
- Calculates delta from initial position
- Updates position via callback
- Cleans up listeners on `mouseUp`

### Resize Implementation
- Uses separate `onMouseDown` on resize handle
- Tracks initial dimensions and mouse position
- Calculates new width/height from delta
- Enforces minimum size constraints
- Updates size via callback

### Event Handling
- `data-no-drag` attribute prevents drag on input fields
- Stops propagation on resize to prevent drag conflicts
- Smooth transitions when not actively dragging/resizing

## Styling & Appearance

### Drag Handle
- Position: Top-left, above component
- Background: Blue (#3b82f6)
- Text: White, small font
- Icon: GripHorizontal
- Visibility: Opacity 0 → 1 on hover

### Resize Handle
- Position: Bottom-right corner
- Size: 16x16px
- Background: Blue (#3b82f6)
- Icon: Maximize2
- Cursor: se-resize
- Visibility: Opacity 0 → 1 on hover

### Selected State
- Ring: 2px blue ring with opacity
- Border: Blue border
- Outline: Dashed blue outline on text/buttons

## Browser Compatibility
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Touch events not yet implemented (desktop only)
- Smooth performance with GPU acceleration

## Performance Considerations
- Absolute positioning for efficient rendering
- No layout recalculations during drag
- Event listeners cleaned up properly
- Minimal re-renders with React optimization

## Future Enhancements
- [ ] Touch support for mobile/tablet
- [ ] Snap-to-grid alignment
- [ ] Multi-select and group move
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts for positioning
- [ ] Alignment guides
- [ ] Z-index/layer management

## Troubleshooting

### Component not dragging
- Check `isEditing` prop is true
- Verify `onPositionChange` callback is defined
- Ensure parent container has `position: relative`

### Resize not working
- Check `onSizeChange` callback is defined
- Verify `minWidth` and `minHeight` are set appropriately
- Ensure resize handle is visible on hover

### Position not persisting
- Verify `handlePositionChange` updates data correctly
- Check data structure includes position fields
- Ensure `onUpdate` callback is called

## Files Modified
1. `DraggableResizable.jsx` - NEW wrapper component
2. `MarketingHero.jsx` - Updated with draggable elements
3. `CenteredHero.jsx` - Updated with draggable elements
4. `CoverBanner.jsx` - Updated with draggable elements

## Testing Checklist
- [ ] Drag headline left/right/up/down
- [ ] Drag button to different position
- [ ] Drag image independently
- [ ] Resize headline to larger size
- [ ] Resize button to smaller size
- [ ] Resize image to different dimensions
- [ ] Verify other elements not affected by moves
- [ ] Check position persists after deselect/reselect
- [ ] Verify edit mode shows handles
- [ ] Verify view mode hides handles
