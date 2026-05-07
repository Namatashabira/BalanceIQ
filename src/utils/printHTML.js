/**
 * printHTML — prints HTML content using a hidden iframe in the current page.
 * No new tab or external software is opened.
 */
export function printHTML(html, title = 'Receipt') {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
      body{margin:0;padding:20px;background:#fff;font-family:Arial,sans-serif}
      @media print{body{padding:0}@page{margin:10mm}}
    </style></head><body>${html}</body></html>`);
    doc.close();

    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
      resolve();
    };

    // Fallback removal in case onafterprint doesn't fire
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      resolve();
    }, 5000);

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  });
}
