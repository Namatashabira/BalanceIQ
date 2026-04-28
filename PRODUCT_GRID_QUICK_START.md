# ProductGrid - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Import Components
```jsx
import ProductGrid from './components/WebsiteBuilder/ProductGrid';
import { sampleProducts } from './data/sampleProducts';
```

### Step 2: Create Basic Grid
```jsx
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

### Step 3: Customize Columns
```jsx
<ProductGrid
  products={sampleProducts}
  desktopColumns={3}    // 3 columns on desktop
  tabletColumns={2}     // 2 columns on tablet
  mobileColumns={1}     // 1 column on mobile
  onAddToCart={handleAddToCart}
  onViewProduct={handleViewProduct}
/>
```

### Step 4: Add Filtering
```jsx
import { filterProducts, sortProducts } from './data/sampleProducts';

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

## 📦 Product Data Format

```javascript
{
  id: '1',
  name: 'Product Name',
  price: 99.99,
  originalPrice: 149.99,
  image: 'https://...',
  rating: 4.5,
  discount: 33,
  stock: 15
}
```

## 🎨 Column Options

### Desktop (> 1024px)
- 2 columns
- 3 columns
- 4 columns (default)
- 5 columns
- 6 columns

### Tablet (640px - 1024px)
- 1 column
- 2 columns (default)
- 3 columns
- 4 columns

### Mobile (< 640px)
- 1 column (default)
- 2 columns
- 3 columns

## 🔧 Common Configurations

### E-commerce Store
```jsx
<ProductGrid
  products={products}
  desktopColumns={4}
  tabletColumns={2}
  mobileColumns={1}
  showRating={true}
  showDiscount={true}
/>
```

### Compact Grid
```jsx
<ProductGrid
  products={products}
  desktopColumns={3}
  tabletColumns={2}
  mobileColumns={1}
/>
```

### Wide Grid
```jsx
<ProductGrid
  products={products}
  desktopColumns={5}
  tabletColumns={3}
  mobileColumns={2}
/>
```

### Single Column
```jsx
<ProductGrid
  products={products}
  desktopColumns={1}
  tabletColumns={1}
  mobileColumns={1}
/>
```

## 🎯 Features

### Product Card
- ✅ Image zoom on hover
- ✅ Discount badge
- ✅ Out of stock overlay
- ✅ Star rating
- ✅ Price display
- ✅ Low stock warning
- ✅ Add to cart button
- ✅ View product button

### Grid
- ✅ Responsive layout
- ✅ Customizable columns
- ✅ Settings panel
- ✅ Empty state
- ✅ Smooth animations

### Filtering
- ✅ Price range
- ✅ Rating filter
- ✅ Stock availability
- ✅ Sort options

## 📱 Responsive Behavior

```
Mobile (< 640px)
├── 1 column (default)
├── 2 columns (optional)
└── 3 columns (optional)

Tablet (640px - 1024px)
├── 1 column
├── 2 columns (default)
├── 3 columns
└── 4 columns

Desktop (> 1024px)
├── 2 columns
├── 3 columns
├── 4 columns (default)
├── 5 columns
└── 6 columns
```

## 🎨 Customization

### Change Colors
Edit ProductCard.jsx:
```jsx
// Button color
className="bg-blue-600 hover:bg-blue-700"

// Badge color
className="bg-red-500"

// Text color
className="text-gray-800"
```

### Change Spacing
Edit ProductGrid.jsx:
```jsx
// Grid gap
className="gap-6"  // Change to gap-4, gap-8, etc.

// Padding
className="p-4"    // Change to p-6, p-8, etc.
```

### Add Custom Styles
```jsx
<ProductGrid
  products={products}
  className="custom-grid"
/>
```

## 🔗 Integration Examples

### With React Router
```jsx
import { useNavigate } from 'react-router-dom';

export default function Shop() {
  const navigate = useNavigate();

  const handleViewProduct = (product) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <ProductGrid
      products={products}
      onViewProduct={handleViewProduct}
    />
  );
}
```

### With Shopping Cart
```jsx
import { useCart } from './context/CartContext';

export default function Shop() {
  const { addToCart } = useCart();

  return (
    <ProductGrid
      products={products}
      onAddToCart={(product) => addToCart(product)}
    />
  );
}
```

### With API
```jsx
import { useEffect, useState } from 'react';

export default function Shop() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <ProductGrid
      products={products}
      onAddToCart={handleAddToCart}
    />
  );
}
```

## 🧪 Testing

### Test with Sample Data
```jsx
import { sampleProducts } from './data/sampleProducts';

<ProductGrid products={sampleProducts} />
```

### Test with Empty State
```jsx
<ProductGrid products={[]} />
```

### Test with Single Product
```jsx
<ProductGrid products={[sampleProducts[0]]} />
```

## 📊 Performance Tips

1. **Use lazy loading** for images
2. **Memoize callbacks** to prevent re-renders
3. **Paginate large lists** for better performance
4. **Optimize images** before uploading
5. **Use CDN** for image hosting

## 🐛 Troubleshooting

### Images Not Showing
- Check image URLs are valid
- Verify CORS is enabled
- Check browser console for errors

### Grid Not Responsive
- Verify TailwindCSS is installed
- Check breakpoints are correct
- Test on different screen sizes

### Buttons Not Working
- Check callbacks are passed
- Verify console for errors
- Test with sample data

## 📚 Full Example

```jsx
import { useState } from 'react';
import ProductGrid from './ProductGrid';
import { sampleProducts, filterProducts, sortProducts } from '../data/sampleProducts';

export default function Shop() {
  const [products, setProducts] = useState(sampleProducts);
  const [sortBy, setSortBy] = useState('newest');

  const handleSort = (newSortBy) => {
    setSortBy(newSortBy);
    setProducts(sortProducts(products, newSortBy));
  };

  const handleAddToCart = (product) => {
    console.log('Added to cart:', product);
    // Add to cart logic here
  };

  const handleViewProduct = (product) => {
    console.log('Viewing product:', product);
    // Navigate to product page
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shop</h1>

        {/* Sort */}
        <div className="mb-6">
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Grid */}
        <ProductGrid
          products={products}
          onAddToCart={handleAddToCart}
          onViewProduct={handleViewProduct}
          desktopColumns={4}
          tabletColumns={2}
          mobileColumns={1}
        />
      </div>
    </div>
  );
}
```

## 🎉 You're Ready!

Start using ProductGrid in your project:

1. Import the component
2. Pass your products
3. Handle callbacks
4. Customize columns
5. Deploy!

---

**Need help?** Check PRODUCT_GRID_DOCUMENTATION.md for detailed information.
