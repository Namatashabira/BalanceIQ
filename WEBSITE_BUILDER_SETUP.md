# Website Builder Implementation

## Overview
A complete drag-and-drop website builder page has been created with component-based architecture and full integration with the admin dashboard.

## Components Created

### 1. **Header** (`Header.jsx`)
- Save button - saves website draft
- Preview button - opens preview in new window
- Publish button - publishes website live

### 2. **TemplateGallery** (`TemplateGallery.jsx`)
- Modal dialog for template selection
- Pre-built templates for ecommerce and agriculture
- Template preview and selection

### 3. **LeftSidebar** (`LeftSidebar.jsx`)
- Draggable components library:
  - Text
  - Image
  - Button
  - Product
  - Grid
  - Section
- Drag-and-drop interface

### 4. **CanvasEditor** (`CanvasEditor.jsx`)
- Main editing canvas
- Drag-and-drop zone for components
- Element selection and deletion
- Visual feedback for selected elements
- Supports multiple element types

### 5. **RightSidebar** (`RightSidebar.jsx`)
- Element settings panel
- Editable properties:
  - Content (text/button)
  - Image URL
  - Background color
  - Text color
  - Padding
- Real-time updates

### 6. **EcommerceSettings** (`EcommerceSettings.jsx`)
- Product selection modal
- Fetches products from API
- Multi-select product display
- Connected to backend products

### 7. **IntegrationPanel** (`IntegrationPanel.jsx`)
- Integration status display
- Inventory System (connected)
- Sales Tracking (connected)
- Accounting (disconnected)
- Connect/Disconnect buttons

### 8. **BuilderWorkspace** (`BuilderWorkspace.jsx`)
- Combines all builder components
- Manages element state
- Handles drag-and-drop logic
- Element CRUD operations

### 9. **WebsiteBuilder** (Main Page)
- Integrates all components
- Toolbar with template, ecommerce, and integration buttons
- Full-page builder interface

## File Structure
```
frontend/src/
├── components/WebsiteBuilder/
│   ├── Header.jsx
│   ├── TemplateGallery.jsx
│   ├── LeftSidebar.jsx
│   ├── CanvasEditor.jsx
│   ├── RightSidebar.jsx
│   ├── EcommerceSettings.jsx
│   ├── IntegrationPanel.jsx
│   └── BuilderWorkspace.jsx
├── pages/WebsiteBuilder/
│   └── WebsiteBuilder.jsx
└── config/
    └── navigationConfig.js (updated)
```

## Integration Points

### Navigation
- Added to sidebar and navbar via `navigationConfig.js`
- Route: `/website-builder`
- Feature flag: `website_builder_enabled`
- Icon: Globe (from lucide-react)

### Routing
- Added to `App.jsx` with access guard
- Protected by `website_builder_enabled` feature flag
- Accessible to admins and authorized users

### API Integration
- EcommerceSettings fetches products from `/api/core/products/`
- Ready for backend integration

## Features

### Drag & Drop
- Drag components from left sidebar to canvas
- Drop to add elements
- Visual feedback during drag operations

### Element Management
- Add elements via drag-and-drop
- Select elements to edit
- Delete elements with trash button
- Real-time property updates

### Settings Panel
- Edit element content
- Customize colors
- Adjust padding
- Configure element-specific properties

### Product Integration
- Browse and select products
- Display products on website
- Connected to inventory system

### Integrations
- Inventory System status
- Sales Tracking status
- Accounting integration
- Connect/disconnect functionality

## Usage

1. Navigate to `/website-builder` from sidebar
2. Click "Choose Template" to select a starting template
3. Drag components from left sidebar to canvas
4. Click elements to select and edit in right panel
5. Click "E-commerce" to add products
6. Click "Integrations" to manage system connections
7. Click "Save" to save draft
8. Click "Preview" to see live preview
9. Click "Publish" to go live

## Feature Flags

Enable in backend settings:
```
website_builder_enabled: true
```

## Future Enhancements

- Template customization
- Advanced styling options
- Mobile preview
- SEO settings
- Analytics integration
- Version history
- Collaboration features
- Custom domain support
