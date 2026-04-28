import { useState } from 'react';
import ProductCard from './ProductCard';
import { Settings, Grid3x3, Grid2x2, Grid4x4 } from 'lucide-react';

export default function ProductGrid({
  products = [],
  onAddToCart,
  onViewProduct,
  showRating = true,
  showDiscount = true,
  desktopColumns = 4,
  tabletColumns = 2,
  mobileColumns = 1,
  onColumnsChange,
  isEditing = false,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [columns, setColumns] = useState({
    desktop: desktopColumns,
    tablet: tabletColumns,
    mobile: mobileColumns,
  });

  const handleColumnChange = (device, value) => {
    const newColumns = { ...columns, [device]: value };
    setColumns(newColumns);
    onColumnsChange?.(newColumns);
  };

  const getGridClass = () => {
    const gridMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };

    return `grid gap-6 
      ${gridMap[columns.mobile] || 'grid-cols-1'}
      sm:${gridMap[columns.tablet] || 'grid-cols-2'}
      lg:${gridMap[columns.desktop] || 'grid-cols-4'}`;
  };

  const getColumnIcon = (count) => {
    switch (count) {
      case 2:
        return <Grid2x2 size={16} />;
      case 3:
        return <Grid3x3 size={16} />;
      case 4:
        return <Grid4x4 size={16} />;
      default:
        return <Grid3x3 size={16} />;
    }
  };

  return (
    <div className="w-full">
      {/* Header with Settings */}
      {isEditing && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Product Grid</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings size={18} />
            <span>Grid Settings</span>
          </button>
        </div>
      )}

      {/* Settings Panel */}
      {isEditing && showSettings && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Customize Grid Layout</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Desktop Columns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desktop Columns
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map((col) => (
                  <button
                    key={col}
                    onClick={() => handleColumnChange('desktop', col)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      columns.desktop === col
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-600'
                    }`}
                    title={`${col} columns`}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Current: {columns.desktop} columns
              </p>
            </div>

            {/* Tablet Columns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tablet Columns
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((col) => (
                  <button
                    key={col}
                    onClick={() => handleColumnChange('tablet', col)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      columns.tablet === col
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-600'
                    }`}
                    title={`${col} columns`}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Current: {columns.tablet} columns
              </p>
            </div>

            {/* Mobile Columns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Columns
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((col) => (
                  <button
                    key={col}
                    onClick={() => handleColumnChange('mobile', col)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      columns.mobile === col
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-600'
                    }`}
                    title={`${col} columns`}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Current: {columns.mobile} columns
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Layout Preview:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📱 Mobile: {columns.mobile} column{columns.mobile > 1 ? 's' : ''}</p>
              <p>📱 Tablet: {columns.tablet} column{columns.tablet > 1 ? 's' : ''}</p>
              <p>🖥️ Desktop: {columns.desktop} column{columns.desktop > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className={getGridClass()}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewProduct={onViewProduct}
              showRating={showRating}
              showDiscount={showDiscount}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <Grid3x3 size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No products available</p>
          <p className="text-gray-400 text-sm">Add products to display them here</p>
        </div>
      )}
    </div>
  );
}
