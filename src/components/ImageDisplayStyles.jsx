import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Thumbnail Grid Display - Shows all images in a responsive grid
 */
export function ThumbnailGridDisplay({ images, isMobile = false }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  const currentImage = images[selectedImage];

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
        <img
          src={currentImage}
          alt={`Product image ${selectedImage + 1}`}
          className="w-full h-64 md:h-96 object-cover transition-transform duration-300"
        />
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`relative overflow-hidden rounded-md transition-all duration-200 ${
                selectedImage === idx
                  ? 'ring-2 ring-blue-500 scale-105'
                  : 'ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-blue-400'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-16 md:h-20 object-cover"
              />
              <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Card-Based Layout - Displays images in a stacked card design
 */
export function CardBasedDisplay({ images, isMobile = false }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  const currentImage = images[selectedImage];

  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden">
        <div className="relative bg-gray-100 dark:bg-gray-600">
          <img
            src={currentImage}
            alt={`Product card ${selectedImage + 1}`}
            className="w-full h-72 md:h-96 object-cover"
          />
          {images.length > 1 && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {selectedImage + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Card Navigation */}
        {images.length > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 flex gap-1 justify-center">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-2 rounded-full transition-all ${
                      selectedImage === idx ? 'bg-blue-600 w-6' : 'bg-gray-300 dark:bg-gray-600 w-2'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Carousel / Slider Display - Full-width auto-advancing carousel
 */
export function CarouselDisplay({ images, isMobile = false }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  const currentImage = images[selectedImage];

  return (
    <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group">
      {/* Main Image */}
      <div className="relative h-96 md:h-[500px]">
        <img
          src={currentImage}
          alt={`Carousel image ${selectedImage + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Top Badge */}
          {images.length > 1 && (
            <div className="flex justify-center">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {selectedImage + 1} / {images.length}
              </div>
            </div>
          )}

          {/* Navigation Arrows */}
          <div className="flex justify-between items-center px-4">
            <button
              onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
              className="p-2 bg-white/80 hover:bg-white dark:bg-gray-700/80 dark:hover:bg-gray-700 rounded-full transition-colors shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
            <button
              onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
              className="p-2 bg-white/80 hover:bg-white dark:bg-gray-700/80 dark:hover:bg-gray-700 rounded-full transition-colors shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-4 bg-gradient-to-t from-black/50 to-transparent">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`h-3 rounded-full transition-all ${
                selectedImage === idx ? 'bg-white w-8' : 'bg-white/50 w-3 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Image with Thumbnails - Main image with side/bottom thumbnails
 */
export function ImageWithThumbnailsDisplay({ images, isMobile = false }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  const currentImage = images[selectedImage];
  const layout = isMobile ? 'flex-col' : 'flex-row';

  return (
    <div className={`flex ${layout} gap-4`}>
      {/* Main Image */}
      <div className={`flex-1 relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden`}>
        <img
          src={currentImage}
          alt={`Main product image ${selectedImage + 1}`}
          className="w-full h-72 md:h-96 object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={`flex gap-2 ${isMobile ? 'flex-row overflow-x-auto pb-2' : 'flex-col'} ${isMobile ? 'w-full' : 'w-20'}`}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                selectedImage === idx
                  ? 'ring-2 ring-blue-500'
                  : 'ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-blue-400'
              } ${isMobile ? 'h-16 w-16 md:h-20 md:w-20' : 'h-20 w-20'}`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedImage === idx && (
                <div className="absolute inset-0 bg-blue-500/20" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Image Gallery Modal - Opens full-screen gallery view
 */
export function ImageGalleryModal({ images, isOpen, onClose, initialIndex = 0 }) {
  const [selectedImage, setSelectedImage] = useState(initialIndex);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[selectedImage];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close gallery"
        >
          <X className="w-8 h-8 text-white" />
        </button>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={currentImage}
            alt={`Gallery image ${selectedImage + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <div className="flex justify-between items-center gap-4 p-4">
            <button
              onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            <div className="text-white text-center">
              {selectedImage + 1} / {images.length}
            </div>

            <button
              onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto justify-center">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden transition-all ${
                  selectedImage === idx
                    ? 'ring-2 ring-blue-400 scale-110'
                    : 'ring-1 ring-white/30 hover:ring-white/50'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Display Component - Routes to appropriate style based on prop
 */
export function ProductImageDisplay({
  images = [],
  displayStyle = 'carousel',
  isMobile = false,
}) {
  switch (displayStyle) {
    case 'grid':
    case 'thumbnail_grid':
      return <ThumbnailGridDisplay images={images} isMobile={isMobile} />;
    case 'card':
    case 'card_based':
      return <CardBasedDisplay images={images} isMobile={isMobile} />;
    case 'carousel':
    case 'slider':
      return <CarouselDisplay images={images} isMobile={isMobile} />;
    case 'thumbnails':
    case 'image_with_thumbnails':
      return <ImageWithThumbnailsDisplay images={images} isMobile={isMobile} />;
    default:
      return <CarouselDisplay images={images} isMobile={isMobile} />;
  }
}
