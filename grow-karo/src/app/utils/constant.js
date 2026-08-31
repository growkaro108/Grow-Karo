export const INDIAN_BANKS = [
  "Axis Bank",
  "AU Small Finance Bank",
  "Bandhan Bank",
  "Bank of Baroda",
  "Bank of India",
  "Bank of Maharashtra",
  "Canara Bank",
  "Central Bank of India",
  "Citibank",
  "City Union Bank",
  "CSB Bank",
  "DBS Bank India",
  "DCB Bank",
  "Deutsche Bank",
  "Dhanlaxmi Bank",
  "Equitas Small Finance Bank",
  "ESAF Small Finance Bank",
  "Federal Bank",
  "HDFC Bank",
  "HSBC Bank",
  "ICICI Bank",
  "IDBI Bank",
  "IDFC FIRST Bank",
  "Indian Bank",
  "Indian Overseas Bank",
  "IndusInd Bank",
  "Jammu & Kashmir Bank",
  "Jana Small Finance Bank",
  "Karnataka Bank",
  "Karur Vysya Bank",
  "Kotak Mahindra Bank",
  "Nainital Bank",
  "North East Small Finance Bank",
  "Punjab & Sind Bank",
  "Punjab National Bank",
  "RBL Bank",
  "South Indian Bank",
  "Standard Chartered Bank",
  "State Bank of India",
  "Suryoday Small Finance Bank",
  "Tamilnad Mercantile Bank",
  "UCO Bank",
  "Ujjivan Small Finance Bank",
  "Unity Small Finance Bank",
  "Union Bank of India",
  "Utkarsh Small Finance Bank",
  "Yes Bank",
];
export function generateChartDataWithPercent(data, opts = {}) {
  const width = opts.width ?? 600;
  const height = opts.height ?? 300;
  const margin = opts.margin ?? { top: 20, right: 20, bottom: 40, left: 60 };
  const innerW = Math.max(1, width - margin.left - margin.right);
  const innerH = Math.max(1, height - margin.top - margin.bottom);
  const yMin = opts.yMin !== undefined ? opts.yMin : 0;
  const jitterPx = opts.jitterPx ?? 8;

  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  function parseDate(s) {
    // Try the known "DD-MMM-YYYY" format first (e.g. "18-Aug-2026").
    // Date.parse's behavior on this format is engine-dependent, so we
    // don't rely on it for a format we control.
    const parts = String(s).split("-");
    if (parts.length === 3 && Number.isNaN(Number(parts[1]))) {
      const day = Number.parseInt(parts[0], 10);
      const mon = parts[1].slice(0, 3).toLowerCase();
      const year = Number.parseInt(parts[2], 10);
      if (months[mon] !== undefined && !Number.isNaN(day) && !Number.isNaN(year)) {
        return new Date(year, months[mon], day);
      }
    }
    // Fallback: ISO / other parseable formats
    const iso = Date.parse(s);
    if (!Number.isNaN(iso)) return new Date(iso);
    return new Date(s);
  }

  if (!Array.isArray(data) || data.length === 0) return [];

  const normalized = data
    .map((d, i) => {
      const dateObj = parseDate(d.date);
      const ts = +dateObj;
      return {
        id: d.id ?? i,
        rawDate: d.date,
        dateObj,
        ts,
        amount: Number(d.amount) || 0,
      };
    })
    // Chronological order — the API doesn't guarantee sort order, and the
    // chart/labels both assume left-to-right = earliest-to-latest.
    .sort((a, b) => a.ts - b.ts);

  const tsVals = normalized.map((d) => d.ts).filter((t) => !Number.isNaN(t));
  const amtVals = normalized.map((d) => d.amount).filter((a) => !Number.isNaN(a));

  // Guard against empty/all-invalid data so Math.min/max don't return Infinity/-Infinity
  if (tsVals.length === 0) return [];

  const tsMin = Math.min(...tsVals);
  const tsMax = Math.max(...tsVals);
  const amtMax = Math.max(...amtVals, yMin);

  const tsRange = tsMax - tsMin || 1;
  const amtRange = amtMax - yMin || 1;

  const groups = {};
  normalized.forEach((d, i) => {
    const key = String(d.ts);
    groups[key] = groups[key] || [];
    groups[key].push({ idx: i, item: d });
  });

  function scaleX(ts) {
    const t = (ts - tsMin) / tsRange;
    return margin.left + t * innerW;
  }
  function scaleY(amount) {
    const t = (amount - yMin) / amtRange;
    return margin.top + (1 - t) * innerH;
  }

  return normalized
    .filter((d) => !Number.isNaN(d.ts))
    .map((d, i) => {
      const baseX = scaleX(d.ts);
      const y = scaleY(d.amount);
      const group = groups[String(d.ts)];
      let x = baseX;
      if (group && group.length > 1) {
        const pos = group.findIndex((g) => g.idx === i);
        const spread = Math.min(jitterPx, innerW * 0.02);
        const offset = (pos - (group.length - 1) / 2) * spread;
        x = baseX + offset;
      }

      // xPercent / yPercent are already 0-100 relative to width/height.
      // Consumers should use them directly as CSS percentages — do not
      // divide by width/height again.
      const xPercent = (x / width) * 100;
      const yPercent = (y / height) * 100;

      return {
        id: d.id,
        date: d.rawDate,
        amount: d.amount,
        x, // pixels (chart coordinate, for SVG cx/cy)
        y, // pixels (chart coordinate, for SVG cx/cy)
        xPercent, // percent 0-100, use directly as `left: ${xPercent}%`
        yPercent, // percent 0-100, use directly as `top: ${yPercent}%`
      };
    });
}

/**
 * Groups transactions by date (summing same-day amounts) and lays them out
 * as bars: one bar per unique date, evenly spaced, height scaled to amount.
 * Bars are the right chart type for discrete daily totals — a line/scatter
 * either overlaps same-day points or implies a false trend between sparse
 * dates.
 */
export function generateBarChartData(data, opts = {}) {
  const width = opts.width ?? 600;
  const height = opts.height ?? 300;
  const margin = opts.margin ?? { top: 20, right: 20, bottom: 40, left: 20 };
  const innerW = Math.max(1, width - margin.left - margin.right);
  const innerH = Math.max(1, height - margin.top - margin.bottom);
  const barWidthRatio = opts.barWidthRatio ?? 0.5; // fraction of each slot's width

  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  function parseDate(s) {
    const parts = String(s).split("-");
    if (parts.length === 3 && Number.isNaN(Number(parts[1]))) {
      const day = Number.parseInt(parts[0], 10);
      const mon = parts[1].slice(0, 3).toLowerCase();
      const year = Number.parseInt(parts[2], 10);
      if (months[mon] !== undefined && !Number.isNaN(day) && !Number.isNaN(year)) {
        return new Date(year, months[mon], day);
      }
    }
    const iso = Date.parse(s);
    if (!Number.isNaN(iso)) return new Date(iso);
    return new Date(s);
  }

  if (!Array.isArray(data) || data.length === 0) return [];

  // Group by date, summing amounts and counting transactions per day.
  const byDate = new Map();
  data.forEach((d, i) => {
    const dateObj = parseDate(d.date);
    const ts = +dateObj;
    if (Number.isNaN(ts)) return;
    const key = String(ts);
    if (!byDate.has(key)) {
      byDate.set(key, { id: d.id ?? i, rawDate: d.date, ts, amount: 0, count: 0 });
    }
    const entry = byDate.get(key);
    entry.amount += Number(d.amount) || 0;
    entry.count += 1;
  });

  const bars = Array.from(byDate.values()).sort((a, b) => a.ts - b.ts);
  if (bars.length === 0) return [];

  const amtMax = Math.max(...bars.map((b) => b.amount), 0);
  const amtRange = amtMax || 1;
  const slotW = innerW / bars.length;
  const barW = slotW * barWidthRatio;

  return bars.map((b, i) => {
    const slotCenterX = margin.left + slotW * (i + 0.5);
    const barHeight = (b.amount / amtRange) * innerH;
    const barX = slotCenterX - barW / 2;
    const barY = margin.top + innerH - barHeight;
    const baselineY = margin.top + innerH;

    return {
      id: b.id,
      date: b.rawDate,
      amount: b.amount,
      count: b.count,
      x: barX, // pixels, SVG rect x
      y: barY, // pixels, SVG rect y (top of bar)
      width: barW, // pixels, SVG rect width
      height: barHeight, // pixels, SVG rect height
      xPercent: (slotCenterX / width) * 100, // center, for label placement
      yPercent: (barY / height) * 100,
      // Hover-trigger box in percent (covers the bar's full footprint from
      // its top down to the chart baseline) — used to size the tooltip
      // trigger element so there's an actual hoverable area over the bar.
      hitLeftPercent: (barX / width) * 100,
      hitTopPercent: (barY / height) * 100,
      hitWidthPercent: (barW / width) * 100,
      hitHeightPercent: ((baselineY - barY) / height) * 100,
    };
  });
}