export const sampleProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 199.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    rating: 4.5,
    discount: 33,
    stock: 15,
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    rating: 4.8,
    discount: 25,
    stock: 8,
  },
  {
    id: '3',
    name: 'Portable Charger 20000mAh',
    price: 49.99,
    originalPrice: 79.99,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop',
    rating: 4.3,
    discount: 37,
    stock: 25,
  },
  {
    id: '4',
    name: 'USB-C Cable 3 Pack',
    price: 19.99,
    originalPrice: 29.99,
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
    rating: 4.6,
    discount: 33,
    stock: 50,
  },
  {
    id: '5',
    name: 'Wireless Mouse',
    price: 34.99,
    originalPrice: 59.99,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
    rating: 4.4,
    discount: 42,
    stock: 0,
  },
  {
    id: '6',
    name: 'Mechanical Keyboard RGB',
    price: 129.99,
    originalPrice: 199.99,
    image: 'https://images.unsplash.com/photo-1587829191301-4b5556b1047e?w=500&h=500&fit=crop',
    rating: 4.7,
    discount: 35,
    stock: 12,
  },
  {
    id: '7',
    name: '4K Webcam',
    price: 89.99,
    originalPrice: 149.99,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
    rating: 4.5,
    discount: 40,
    stock: 7,
  },
  {
    id: '8',
    name: 'Phone Stand Adjustable',
    price: 24.99,
    originalPrice: 39.99,
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c3ca4b7f1?w=500&h=500&fit=crop',
    rating: 4.2,
    discount: 37,
    stock: 30,
  },
  {
    id: '9',
    name: 'Laptop Stand Aluminum',
    price: 59.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    rating: 4.6,
    discount: 40,
    stock: 18,
  },
  {
    id: '10',
    name: 'LED Desk Lamp',
    price: 44.99,
    originalPrice: 74.99,
    image: 'https://images.unsplash.com/photo-1565636192335-14c46fa1120d?w=500&h=500&fit=crop',
    rating: 4.4,
    discount: 40,
    stock: 22,
  },
  {
    id: '11',
    name: 'Bluetooth Speaker',
    price: 79.99,
    originalPrice: 129.99,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    rating: 4.5,
    discount: 38,
    stock: 14,
  },
  {
    id: '12',
    name: 'Screen Protector Pack',
    price: 14.99,
    originalPrice: 24.99,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
    rating: 4.3,
    discount: 40,
    stock: 60,
  },
];

export const getProductById = (id) => {
  return sampleProducts.find((product) => product.id === id);
};

export const getProductsByCategory = (category) => {
  // This is a placeholder - in a real app, products would have categories
  return sampleProducts;
};

export const filterProducts = (products, filters) => {
  return products.filter((product) => {
    if (filters.minPrice && product.price < filters.minPrice) return false;
    if (filters.maxPrice && product.price > filters.maxPrice) return false;
    if (filters.minRating && product.rating < filters.minRating) return false;
    if (filters.inStockOnly && product.stock === 0) return false;
    return true;
  });
};

export const sortProducts = (products, sortBy) => {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'newest':
      return sorted.reverse();
    default:
      return sorted;
  }
};
