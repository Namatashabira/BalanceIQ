# ProductGrid Component - Complete Documentation

## Overview
A fully responsive, customizable product grid component for e-commerce websites built with React and TailwindCSS. Features include responsive layouts, product filtering, sorting, and interactive product cards.

## Components

### 1. ProductCard Component
Individual product card with image, price, rating, and action buttons.

**Location**: `src/components/WebsiteBuilder/ProductCard.jsx`

**Props**:
```javascript
{
  product: {
    id: string,
    name: string,
    price: number,
    originalPrice: number,
    image: string,
    rating: number (0-5),
    discount: number (0-100),
    stock: number
  },
  onAddToCart: function(product),
  onViewProduct: function(product),
  showRating: boolean (default: true),
  showDiscount: boolean (default: true)
}
```

**Features**:
- Image zoom on hover
- Discount badge display
- Out of stock overlay
- Star rating display
- Price with discount calculation
- Low stock warning
- Add to cart button
- View product button
- Image error handling

**Example Usage**:
```jsx
<ProductCard
  product={{
    id: '1',
    name: 'Wireless Headphones',
    price: 199.99,
    originalPrice: 299.99,
    image: 'https://...',
    rating: 4.5,
    discount: 33,
    stock: 15
  }}
  onAddToCart={(product) => console.log('Added:', product)}
  onViewProduct={(product) => console.log('Viewing:', product)}
  showRating={true}
  showDiscount={true}
/>
```

### 2. ProductGrid Component
Main grid container with customizable layout and settings panel.

**Location**: `src/components/WebsiteBuilder/ProductGrid.jsx`

**Props**:
```javascript
{
  products: array (default: []),
  onAddToCart: function(product),
  onViewProduct: function(product),
  showRating: boolean (default: true),
  showDiscount: boolean (default: true),
  desktopColumns: number (default: 4),
  tabletColumns: number (default: 2),
  mobileColumns: number (default: 1),
  onColumnsChange: function(columns),
  isEditing: boolean (default: false)
}
```

**Features**:
- Responsive grid layout
- Customizable columns per device
- Settings panel for layout customization
- Empty state message
- Smooth transitions
- Mobile-first design

**Column Options**:
- Desktop: 2-6 columns
- Tablet: 1-4 columns
- Mobile: 1-3 columns

**Example Usage**:
```jsx
<ProductGrid
  products={sampleProducts}
  onAddToCart={handleAddToCart}
  onViewProduct={handleViewProduct}
  desktopColumns={4}
  tabletColumns={2}
  mobileColumns={1}
  isEditing={true}
  onColumnsChange={(columns) => console.log('Columns:', columns)}
/>
```

## Product Data Structure

```javascript
{
  id: string,              // Unique identifier
  name: string,            // Product name
  price: number,           // Current price
  originalPrice: number,   // Original price (for discount calculation)
  image: string,           // Product image URL
  rating: number,          // Rating 0-5
  discount: number,        // Discount percentage 0-100
  stock: number            // Stock quantity
}
```

## Sample Products

Located in: `src/data/sampleProducts.js`

Includes 12 sample tech products with:
- Realistic pricing
- Discount information
- Stock levels
- Ratings
- High-quality images from Unsplash

**Available Functions**:
- `sampleProducts` - Array of all sample products
- `getProductById(id)` - Get product by ID
- `getProductsByCategory(category)` - Get products by category
- `filterProducts(products, filters)` - Filter products
- `sortProducts(products, sortBy)` - Sort products

## Responsive Breakpoints

```
Mobile:  < 640px  (1-3 columns)
Tablet:  640px-1024px (1-4 columns)
Desktop: > 1024px (2-6 columns)
```

## Features

### 1. Product Card Features
- ✅ Image zoom on hover
- ✅ Discount badge
- ✅ Out of stock overlay
- ✅ Star rating display
- ✅ Price with discount
- ✅ Low stock warning
- ✅ Add to cart button
- ✅ View product button
- ✅ Image error handling
- ✅ Responsive design

### 2. Grid Features
- ✅ Customizable columns
- ✅ Responsive layout
- ✅ Settings panel
- ✅ Empty state
- ✅ Smooth transitions
- ✅ Mobile-first design
- ✅ Accessibility support

### 3. Filtering & Sorting
- ✅ Price range filter
- ✅ Rating filter
- ✅ Stock availability filter
- ✅ Sort by price (low to high)
- ✅ Sort by price (high to low)
- ✅ Sort by rating
- ✅ Sort by newest

## Usage Examples

### Basic Usage
```jsx
import ProductGrid from './ProductGrid';
import { sampleProducts } from '../data/sampleProducts';

export default function Shop() {
  return (
    <ProductGrid
      products={sampleProducts}
      onAddToCart={(product) => console.log('Added:', product)}
      onViewProduct={(product) => console.log('Viewing:', product)}
    />
  );
}
```

### With Custom Columns
```jsx
<ProductGrid
  products={sampleProducts}
  desktopColumns={3}
  tabletColumns={2}
  mobileColumns={1}
  onAddToCart={handleAddToCart}
  onViewProduct={handleViewProduct}
/>
```

### With Filtering
```jsx
import { filterProducts, sortProducts } from '../data/sampleProducts';

const [products, setProducts] = useState(sampleProducts);

const handleFilter = (filters) => {
  const filtered = filterProducts(sampleProducts, filters);
  setProducts(filtered);
};

const handleSort = (sortBy) => {
  const sorted = sortProducts(products, sortBy);
  setProducts(sorted);
};
```

### Full Demo with All Features
```jsx
import ProductGridDemo from './ProductGridDemo';

export default function App() {
  return <ProductGridDemo />;
}
```

## Styling

### TailwindCSS Classes Used
- `grid` - Grid layout
- `gap-6` - Grid gap
- `grid-cols-*` - Column count
- `sm:grid-cols-*` - Tablet columns
- `lg:grid-cols-*` - Desktop columns
- `aspect-square` - Image container
- `line-clamp-2` - Text truncation
- `hover:scale-110` - Image zoom
- `transition-*` - Smooth animations

### Customization
All components use TailwindCSS and can be customized by:
1. Modifying class names
2. Changing color schemes
3. Adjusting spacing
4. Modifying animations

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Color contrast
- ✅ Disabled state handling
- ✅ Alt text for images
- ✅ Button titles

## Performance

- ✅ Optimized images
- ✅ Lazy loading ready
- ✅ Minimal re-renders
- ✅ Efficient filtering
- ✅ Smooth animations

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## File Structure

```
src/
├── components/
│   └── WebsiteBuilder/
│       ├── ProductCard.jsx
│       ├── ProductGrid.jsx
│       └── ProductGridDemo.jsx
└── data/
    └── sampleProducts.js
```

## Integration with Website Builder

To add ProductGrid to the website builder:

1. Add to LeftSidebar blocks
2. Create ProductGridBlock component
3. Handle drag-drop
4. Store grid configuration
5. Render in canvas

## Customization Guide

### Change Column Layout
```jsx
<ProductGrid
  desktopColumns={3}  // 3 columns on desktop
  tabletColumns={2}   // 2 columns on tablet
  mobileColumns={1}   // 1 column on mobile
/>
```

### Change Colors
Modify ProductCard.jsx:
```jsx
// Change button colors
className="bg-blue-600 hover:bg-blue-700"

// Change badge colors
className="bg-red-500"

// Change text colors
className="text-gray-800"
```

### Add More Features
- Add wishlist button
- Add quick view modal
- Add product comparison
- Add reviews section
- Add related products

## Common Issues & Solutions

### Images Not Loading
- Check image URLs are valid
- Verify CORS is enabled
- Use fallback images

### Grid Not Responsive
- Check TailwindCSS is configured
- Verify breakpoints are correct
- Test on different screen sizes

### Buttons Not Working
- Verify callbacks are passed
- Check console for errors
- Test with sample data

## Future Enhancements

- [ ] Wishlist functionality
- [ ] Quick view modal
- [ ] Product comparison
- [ ] Customer reviews
- [ ] Related products
- [ ] Lazy loading
- [ ] Infinite scroll
- [ ] Advanced filters
- [ ] Search functionality
- [ ] Category filtering

## Dependencies

- React 18+
- TailwindCSS 3+
- Lucide React (icons)

## License

MIT

## Support

For issues or questions, refer to the example usage in ProductGridDemo.jsx
