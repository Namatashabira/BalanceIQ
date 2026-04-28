# Website Builder - Quick Reference

## Access
- **URL**: `/website-builder`
- **Navigation**: Sidebar → Website Builder (Globe icon)
- **Feature Flag**: `website_builder_enabled`

## Main Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Website Builder | Undo | Redo | Reset | Save | Preview | Publish│
├─────────────────────────────────────────────────────────────────┤
│ Choose Template | E-commerce | Integrations | Tip              │
├──────────────┬──────────────────────────────┬──────────────────┤
│              │                              │                  │
│  Components  │      LIVE PREVIEW CANVAS     │    Settings      │
│  & Blocks    │                              │    Panel         │
│              │  (Drag elements here)        │                  │
│  [Collapse]  │                              │  [Collapse]      │
│              │                              │                  │
└──────────────┴──────────────────────────────┴──────────────────┘
```

## Left Sidebar - Components Tab

| Component | Use Case |
|-----------|----------|
| **Text** | Add paragraphs, headings, descriptions |
| **Image** | Add product images, banners, icons |
| **Button** | Add clickable buttons, CTAs |
| **Product** | Display individual products |
| **Grid** | Create multi-column layouts |
| **Section** | Create container sections |

## Left Sidebar - Blocks Tab

| Block | Elements | Use |
|-------|----------|-----|
| **Hero** | Section + Text + Button | Page header |
| **Features** | Section + Grid | Feature showcase |
| **Products** | Section + Grid + 4 Products | Product display |
| **Testimonials** | Section + Text | Customer reviews |
| **CTA** | Section + Text + Button | Call to action |
| **Footer** | Section + Text | Page footer |

## Right Sidebar - Settings

### All Elements
- **Type**: Element type (read-only)
- **Background Color**: Hex color picker
- **Text Color**: Hex color picker
- **Padding**: 0-50px
- **Margin**: 0-50px
- **Width**: Full/Half/Third/Auto
- **Text Align**: Left/Center/Right

### Text & Button
- **Content**: Editable text area

### Image
- **Image URL**: Link to image file

## Toolbar Buttons

| Button | Action |
|--------|--------|
| **Choose Template** | Load pre-built template |
| **E-commerce** | Select products to display |
| **Integrations** | Manage system connections |

## Header Controls

| Control | Action |
|---------|--------|
| **Undo** | Revert last change |
| **Redo** | Redo last undo |
| **Reset** | Clear entire canvas |
| **Save** | Save draft |
| **Preview** | Open live preview |
| **Publish** | Publish website |

## Element Actions

### On Canvas
- **Click**: Select element
- **Drag**: Move element (future)
- **Copy Icon**: Duplicate element
- **Trash Icon**: Delete element

### In Settings
- **Edit**: Modify properties
- **Color Picker**: Choose colors
- **Sliders**: Adjust spacing
- **Dropdowns**: Select options

## Workflow Example

1. **Start**
   ```
   Click "Choose Template" → Select "Modern Store"
   ```

2. **Customize Hero**
   ```
   Click Hero Section → Edit in Right Sidebar
   Change background color, text, button text
   ```

3. **Add Products**
   ```
   Click "E-commerce" → Select products
   Drag "Products Grid" block to canvas
   ```

4. **Add CTA**
   ```
   Drag "Call to Action" block to canvas
   Edit text and button in Right Sidebar
   ```

5. **Save & Publish**
   ```
   Click "Save" → Click "Publish"
   ```

## Keyboard Shortcuts (Future)

```
Ctrl+Z     Undo
Ctrl+Y     Redo
Delete     Delete selected
Ctrl+D     Duplicate
Ctrl+S     Save
```

## Tips & Tricks

### Efficiency
- Use **Blocks** for faster building
- **Duplicate** elements to save time
- Use **Templates** as starting point

### Design
- Keep **padding consistent** (16-24px)
- Use **color picker** for brand colors
- Test **text alignment** for readability

### Organization
- Name sections clearly
- Group related elements
- Use **sections** as containers

## Common Issues

| Issue | Solution |
|-------|----------|
| Sidebar closed | Click chevron button to open |
| Can't edit element | Click element to select (blue border) |
| Changes not showing | Ensure Right Sidebar is open |
| Drag not working | Refresh page, check browser |

## Element Limits

- **Maximum elements**: Unlimited
- **Canvas height**: Unlimited (scrollable)
- **Undo/Redo**: Full history
- **File size**: Depends on images

## Supported Formats

- **Images**: JPG, PNG, WebP, GIF
- **Colors**: Hex (#RRGGBB)
- **Text**: Plain text, no HTML

## Export & Sharing

- **Save**: Draft saved to database
- **Preview**: Shareable preview link
- **Publish**: Live website URL

## Performance

- **Load time**: < 2 seconds
- **Save time**: < 1 second
- **Preview**: Instant
- **Publish**: < 5 seconds

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers

## Data Storage

- Drafts: Database
- Published: Live server
- History: Session memory
- Images: CDN

## Security

- ✅ CSRF protection
- ✅ XSS prevention
- ✅ SQL injection prevention
- ✅ Role-based access

## Support Resources

- 📖 Full Documentation: `WEBSITE_BUILDER_COMPLETE.md`
- 💬 Component Code: Comments in source files
- 🐛 Issues: Check browser console
- 📧 Help: Contact development team

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
