import { useState, useRef, useEffect } from 'react';
import { GripHorizontal, Maximize2 } from 'lucide-react';

export default function DraggableResizable({
  id,
  children,
  onPositionChange,
  onSizeChange,
  position = { x: 0, y: 0 },
  size = { width: 'auto', height: 'auto' },
  isEditing = false,
  minWidth = 50,
  minHeight = 30,
  isDraggable = true,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef(null);

  const handleDragStart = (e) => {
    if (!isEditing || !isDraggable) return;
    if (e.target.closest('[data-no-drag]')) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    onPositionChange?.({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (e) => {
    if (!isEditing) return;

    setIsResizing(true);
    const rect = containerRef.current?.getBoundingClientRect();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect?.width || 0,
      height: rect?.height || 0,
    });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    const newWidth = Math.max(minWidth, resizeStart.width + deltaX);
    const newHeight = Math.max(minHeight, resizeStart.height + deltaY);

    onSizeChange?.({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragStart, position]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart]);

  const containerStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: typeof size.width === 'number' ? `${size.width}px` : size.width,
    height: typeof size.height === 'number' ? `${size.height}px` : size.height,
    cursor: isDragging ? 'grabbing' : isEditing && isDraggable ? 'grab' : 'default',
    transition: isDragging || isResizing ? 'none' : 'all 0.2s',
    zIndex: isDragging || isResizing ? 1000 : 'auto',
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={isDraggable ? handleDragStart : undefined}
      className={`group ${isEditing ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      {/* Drag Handle */}
      {isEditing && isDraggable && (
        <div className="absolute -top-7 left-0 flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
          <GripHorizontal size={12} />
          <span>Drag</span>
        </div>
      )}

      {/* Content */}
      <div data-no-drag className="w-full h-full">
        {children}
      </div>

      {/* Resize Handle */}
      {isEditing && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl cursor-se-resize opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-50"
          title="Drag to resize"
        >
          <Maximize2 size={10} className="text-white" />
        </div>
      )}
    </div>
  );
}
