# Website Builder - Visual Guide

## Main Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🌐 Website Builder    [↶ Undo] [↷ Redo] [↻ Reset]    [💾 Save] [👁 Preview] [✓ Publish] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📋 Choose Template] [⚙️ E-commerce] [🔌 Integrations]    💡 Tip: Drag components...  │
├──────────────────────┬──────────────────────────────────────┬────────────────────────┤
│                      │                                      │                        │
│  📦 COMPONENTS       │                                      │  ⚙️ SETTINGS           │
│  ┌────────────────┐  │                                      │  ┌──────────────────┐  │
│  │ 📝 Text        │  │                                      │  │ Type: text       │  │
│  │ 🖼️ Image       │  │      LIVE PREVIEW CANVAS             │  │ Content: [text]  │  │
│  │ 🔘 Button      │  │                                      │  │ BG Color: [🎨]   │  │
│  │ 🛍️ Product     │  │  ┌──────────────────────────────┐   │  │ Text Color: [🎨] │  │
│  │ 📊 Grid        │  │  │                              │   │  │ Padding: [====]  │  │
│  │ 📦 Section     │  │  │  Your Website Content Here   │   │  │ Margin: [====]   │  │
│  └────────────────┘  │  │                              │   │  │ Width: [Full ▼]  │  │
│                      │  │  (Drag elements here)        │   │  │ Align: [Left ▼]  │  │
│  🧩 BLOCKS           │  │                              │   │  └──────────────────┘  │
│  ┌────────────────┐  │  │                              │   │                        │
│  │ 🎯 Hero        │  │  │                              │   │  [Close ▶]             │
│  │ ⭐ Features    │  │  │                              │   │                        │
│  │ 🛒 Products    │  │  │                              │   │                        │
│  │ 💬 Testimonials│  │  │                              │   │                        │
│  │ 📢 CTA         │  │  │                              │   │                        │
│  │ 🔗 Footer      │  │  │                              │   │                        │
│  └────────────────┘  │  └──────────────────────────────┘   │                        │
│                      │                                      │                        │
│  [Close ◀]           │  Canvas: 5 elements                 │                        │
│                      │                                      │                        │
└──────────────────────┴──────────────────────────────────────┴────────────────────────┘
```

## Sidebar States

### Left Sidebar - Open
```
┌──────────────────┐
│ Elements    [◀]  │
├──────────────────┤
│ Components │Blocks│
├──────────────────┤
│ 📝 Text          │
│ 🖼️ Image         │
│ 🔘 Button        │
│ 🛍️ Product       │
│ 📊 Grid          │
│ 📦 Section       │
└──────────────────┘
```

### Left Sidebar - Closed
```
┌─┐
│ │ (Just a thin line)
│ │
│ │
└─┘
```

### Right Sidebar - Open
```
┌──────────────────┐
│ Settings    [▶]  │
├──────────────────┤
│ Type: text       │
│ Content: [text]  │
│ BG Color: [🎨]   │
│ Text Color: [🎨] │
│ Padding: [====]  │
│ Margin: [====]   │
│ Width: [Full ▼]  │
│ Align: [Left ▼]  │
└──────────────────┘
```

### Right Sidebar - Closed
```
┌─┐
│▶│ (Thin button)
│▶│
│▶│
└─┘
```

## Element Selection

### Unselected Element
```
┌─────────────────────┐
│ This is some text   │
└─────────────────────┘
```

### Selected Element
```
┌═════════════════════╗
│ This is some text   │ [📋] [🗑️]
╚═════════════════════╝
```

## Block Example - Hero Section

```
┌─────────────────────────────────────────┐
│ 🎯 Hero Section                         │
│ ┌───────────────────────────────────┐   │
│ │ Welcome to Your Store             │   │
│ │ [Shop Now]                        │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Block Example - Products Grid

```
┌─────────────────────────────────────────┐
│ 🛒 Products Grid                        │
│ ┌──────────┬──────────┬──────────┬──────┐
│ │ Product1 │ Product2 │ Product3 │ Prod4│
│ │ $10.00   │ $15.00   │ $20.00   │ $25  │
│ └──────────┴──────────┴──────────┴──────┘
└─────────────────────────────────────────┘
```

## Drag & Drop Flow

### Step 1: Hover Over Component
```
┌──────────────────┐
│ 📝 Text    ← Hover
│ 🖼️ Image
│ 🔘 Button
└──────────────────┘
```

### Step 2: Start Dragging
```
┌──────────────────┐
│ 📝 Text ↗ (Dragging...)
│ 🖼️ Image
│ 🔘 Button
└──────────────────┘
```

### Step 3: Drag Over Canvas
```
┌──────────────────────────────────────┐
│ Canvas (Drag over here)              │
│ ↓ Drop zone active                   │
└──────────────────────────────────────┘
```

### Step 4: Drop Element
```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ Text element added to canvas     │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Color Picker Interface

```
┌─────────────────────────────────┐
│ Background Color                │
│ ┌────┬──────────────────────┐   │
│ │ 🎨 │ #FFFFFF              │   │
│ └────┴──────────────────────┘   │
│ (Click color box to open picker) │
└─────────────────────────────────┘
```

## Spacing Controls

### Padding Slider
```
┌─────────────────────────────────┐
│ Padding                         │
│ [━━━━━━━━━●━━━━━━━━━━━━━━━━━━] │
│ 16px                            │
└─────────────────────────────────┘
```

### Margin Slider
```
┌─────────────────────────────────┐
│ Margin                          │
│ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━] │
│ 0px                             │
└─────────────────────────────────┘
```

## Dropdown Selectors

### Width Selector
```
┌─────────────────────────────────┐
│ Width                           │
│ ┌─────────────────────────────┐ │
│ │ Full Width              ▼   │ │
│ └─────────────────────────────┘ │
│ Options:                        │
│ • Full Width                    │
│ • Half Width                    │
│ • One Third                     │
│ • Auto                          │
└─────────────────────────────────┘
```

### Text Alignment Selector
```
┌─────────────────────────────────┐
│ Text Alignment                  │
│ ┌─────────────────────────────┐ │
│ │ Left                    ▼   │ │
│ └─────────────────────────────┘ │
│ Options:                        │
│ • Left                          │
│ • Center                        │
│ • Right                         │
└─────────────────────────────────┘
```

## Header Button States

### Normal State
```
[💾 Save] [👁 Preview] [✓ Publish]
```

### Hover State
```
[💾 Save] [👁 Preview] [✓ Publish]
  ↑ Darker background
```

### Disabled State (Undo/Redo)
```
[↶ Undo] [↷ Redo]
  ↑ Grayed out, not clickable
```

## Modal Dialogs

### Template Gallery
```
┌─────────────────────────────────────┐
│ Choose a Template          [✕]      │
├─────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐           │
│ │ Modern   │ │ Minimal  │           │
│ │ Store    │ │ Shop     │           │
│ └──────────┘ └──────────┘           │
│ ┌──────────┐ ┌──────────┐           │
│ │ Agri Pro │ │ Farm     │           │
│ │          │ │ Fresh    │           │
│ └──────────┘ └──────────┘           │
└─────────────────────────────────────┘
```

### E-commerce Settings
```
┌─────────────────────────────────────┐
│ E-commerce Settings        [✕]      │
├─────────────────────────────────────┤
│ Select Products to Display          │
│ ☑ Product 1 - $10.00                │
│ ☑ Product 2 - $15.00                │
│ ☐ Product 3 - $20.00                │
│ ☑ Product 4 - $25.00                │
├─────────────────────────────────────┤
│ [Cancel]                    [Apply] │
└─────────────────────────────────────┘
```

### Integrations Panel
```
┌─────────────────────────────────────┐
│ Integrations               [✕]      │
├─────────────────────────────────────┤
│ 📦 Inventory System                 │
│ ✓ Connected                         │
│ [Disconnect]                        │
│                                     │
│ 💰 Sales Tracking                   │
│ ✓ Connected                         │
│ [Disconnect]                        │
│                                     │
│ 📊 Accounting                       │
│ ✗ Disconnected                      │
│ [Connect]                           │
├─────────────────────────────────────┤
│ [Close]                             │
└─────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (1024px+)
```
[Sidebar] [Canvas] [Sidebar]
All visible
```

### Tablet (768px - 1023px)
```
[◀] [Canvas] [▶]
Sidebars collapse to buttons
```

### Mobile (< 768px)
```
[Canvas]
Sidebars hidden, accessible via buttons
```

## Element Types Visual

### Text Element
```
┌─────────────────────┐
│ This is text        │
│ It can be edited    │
└─────────────────────┘
```

### Image Element
```
┌─────────────────────┐
│ [Image Placeholder] │
└─────────────────────┘
```

### Button Element
```
┌─────────────────────┐
│ [Click Me Button]   │
└─────────────────────┘
```

### Product Element
```
┌─────────────────────┐
│ [Product Image]     │
│ Product Name        │
│ $19.99              │
│ [Add to Cart]       │
└─────────────────────┘
```

### Grid Element
```
┌─────────────────────┐
│ ┌──┐ ┌──┐ ┌──┐     │
│ │C1│ │C2│ │C3│     │
│ └──┘ └──┘ └──┘     │
└─────────────────────┘
```

### Section Element
```
┌─────────────────────┐
│ Section Title       │
│ (Container)         │
└─────────────────────┘
```

## Workflow Visualization

```
START
  ↓
[Choose Template] (Optional)
  ↓
[Add Components/Blocks]
  ↓
[Select Element]
  ↓
[Edit in Settings]
  ↓
[Duplicate/Delete as needed]
  ↓
[Save Draft]
  ↓
[Preview]
  ↓
[Publish]
  ↓
END
```

## Color Scheme

```
Primary Colors:
- Blue: #3b82f6 (Buttons, Highlights)
- Green: #16a34a (Publish, Success)
- Red: #dc2626 (Delete, Danger)
- Gray: #6b7280 (Text, Borders)

Background Colors:
- White: #ffffff (Canvas, Panels)
- Light Gray: #f3f4f6 (Backgrounds)
- Dark Gray: #1f2937 (Text)

Accent Colors:
- Purple: #a855f7 (Blocks)
- Orange: #f97316 (Integrations)
```

## Icon Legend

```
🌐 Website Builder
📋 Template
⚙️ Settings
🔌 Integrations
📦 Components
🧩 Blocks
🎯 Hero
⭐ Features
🛒 Products
💬 Testimonials
📢 CTA
🔗 Footer
📝 Text
🖼️ Image
🔘 Button
🛍️ Product
📊 Grid
📦 Section
💾 Save
👁 Preview
✓ Publish
↶ Undo
↷ Redo
↻ Reset
✕ Close
◀ Collapse
▶ Expand
🎨 Color Picker
```

---

**Visual Guide Complete**
**All UI elements documented**
**Ready for implementation**
