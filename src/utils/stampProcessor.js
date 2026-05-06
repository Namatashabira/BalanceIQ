/**
 * Composites a stamp image with the current date.
 * opts: { offsetX, offsetY, rotate (deg), circular, fontSize }
 */
export function buildStampWithDate(stampDataUrl, opts = {}) {
  const { offsetX = 0, offsetY = 0, rotate = 0, circular = false } = opts;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // Clip to circle if requested
      if (circular) {
        const r = Math.min(canvas.width, canvas.height) / 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
        ctx.clip();
      }

      ctx.drawImage(img, 0, 0);

      // Find visual center by scanning non-background pixels
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const corners = [[2,2],[width-3,2],[2,height-3],[width-3,height-3]]
        .map(([x,y]) => { const i=(y*width+x)*4; return {r:data[i],g:data[i+1],b:data[i+2],a:data[i+3]}; });
      const bg = corners.reduce((a,b) => b.a > a.a ? b : a);
      const THRESH = 40;
      let minX=width, maxX=0, minY=height, maxY=0;
      for (let y=0; y<height; y++) {
        for (let x=0; x<width; x++) {
          const i=(y*width+x)*4;
          if (data[i+3]<30) continue;
          const dr=data[i]-bg.r, dg=data[i+1]-bg.g, db=data[i+2]-bg.b;
          if (Math.sqrt(dr*dr+dg*dg+db*db) < THRESH) continue;
          if (x<minX) minX=x; if (x>maxX) maxX=x;
          if (y<minY) minY=y; if (y>maxY) maxY=y;
        }
      }
      const coverX = (maxX-minX)/width, coverY = (maxY-minY)/height;
      const cx = coverX>0.8 ? width/2  : (minX+maxX)/2;
      const cy = coverY>0.8 ? height/2 : (minY+maxY)/2;
      const stampH = coverY>0.8 ? height : (maxY-minY);

      const dateStr = new Date().toLocaleDateString('en-GB');
      const fontSize = Math.max(10, Math.round(stampH * 0.13));

      // Apply position + rotation transform
      ctx.save();
      ctx.translate(cx + offsetX, cy + offsetY);
      ctx.rotate((rotate * Math.PI) / 180);

      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = fontSize * 0.4;
      ctx.lineJoin = 'round';
      ctx.strokeText(dateStr, 0, 0);
      ctx.fillStyle = '#b91c1c';
      ctx.fillText(dateStr, 0, 0);
      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(stampDataUrl);
    img.src = stampDataUrl;
  });
}
