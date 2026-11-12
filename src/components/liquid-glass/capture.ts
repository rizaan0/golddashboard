const MAX_DPR = 2;

function pageCss() {
  const chunks: string[] = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) chunks.push(rule.cssText);
    } catch {
      continue;
    }
  }
  return chunks.join("\n").replace(/<\/style/gi, "<\\/style");
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Background capture failed"));
    image.src = url;
  });
}

async function captureWithForeignObject(rect: DOMRect, dpr: number) {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-liquid-glass], script, canvas, iframe, video").forEach((node) => node.remove());
  const width = window.innerWidth;
  const height = window.innerHeight;
  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;background:${getComputedStyle(document.body).backgroundColor}">
        <style>${pageCss()}</style>
        <div style="position:absolute;left:${-window.scrollX}px;top:${-window.scrollY}px">${markup}</div>
      </div>
    </foreignObject>
  </svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function variance(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return 0;
  try {
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    let sum = 0;
    const tones: number[] = [];
    for (let index = 0; index < data.length; index += 64) {
      const tone = ((data[index] ?? 0) + (data[index + 1] ?? 0) + (data[index + 2] ?? 0)) / 3;
      tones.push(tone);
      sum += tone;
      count += 1;
    }
    if (count === 0) return 0;
    const mean = sum / count;
    return tones.reduce((total, tone) => total + (tone - mean) ** 2, 0) / count;
  } catch {
    return 0;
  }
}

function captureElementColors(rect: DOMRect, dpr: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = getComputedStyle(document.body).backgroundColor || "#f2f2f7";
  context.fillRect(0, 0, rect.width, rect.height);
  for (const node of document.body.querySelectorAll("*")) {
    if (!(node instanceof HTMLElement) || node.closest("[data-liquid-glass]")) continue;
    const style = getComputedStyle(node);
    const color = style.backgroundColor;
    if (!color || color === "rgba(0, 0, 0, 0)" || color === "transparent") continue;
    const box = node.getBoundingClientRect();
    if (box.right < rect.x || box.bottom < rect.y || box.left > rect.right || box.top > rect.bottom) continue;
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(box.x - rect.x, box.y - rect.y, box.width, box.height, Number.parseFloat(style.borderRadius) || 0);
    context.fill();
  }
  return canvas;
}

function captureBackdrop(rect: DOMRect, dpr: number) {
  const node = document.querySelector("[data-glass-backdrop]");
  if (!(node instanceof HTMLCanvasElement) || node.width < 2 || node.height < 2) return null;
  const box = node.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(
    node,
    ((rect.x - box.x) / box.width) * node.width,
    ((rect.y - box.y) / box.height) * node.height,
    (rect.width / box.width) * node.width,
    (rect.height / box.height) * node.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

export async function captureRegion(rect: DOMRect) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  if (document.querySelector("[data-glass-backdrop]")) {
    const backdrop = captureBackdrop(rect, dpr);
    if (backdrop) return backdrop;
  }
  const painted = captureElementColors(rect, dpr);
  try {
    const captured = await captureWithForeignObject(rect, dpr);
    if (captured && variance(captured) >= variance(painted)) return captured;
  } catch {
    // The document could not be rasterized. The element sample is still the live layout.
  }
  return painted;
}
