export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function formatLocationBasis(basis?: string | null): string {
  switch (basis) {
    case 'creation':
      return 'Creation Location (Workshop/Studio)';
    case 'depicted':
      return 'Depicted Subject Location';
    case 'discovery':
      return 'Archaeological Discovery Site';
    default:
      return 'Documented Provenance Location';
  }
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 4500) return 'badge-gold';
  if (score >= 3500) return 'badge-emerald';
  if (score >= 2000) return 'badge-amber';
  return 'badge-slate';
}

/** 35.6895, 139.6917 -> "35.6895° N, 139.6917° E" */
export function formatCoordinates(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

/** "artifact-005" -> "V" style plate numeral for catalogue captions. */
export function plateNumeral(index: number): string {
  const map: Array<[number, string]> = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = index + 1;
  let out = '';
  for (const [value, sym] of map) {
    while (n >= value) {
      out += sym;
      n -= value;
    }
  }
  return out;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapTitle(title: string, max = 34): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

type Motif = 'wave' | 'stele' | 'bust' | 'swirl' | 'army' | 'terrace' | 'compass';

function motifFor(id: string): Motif {
  if (id.startsWith('fixture')) return 'compass';
  if (id.includes('001') || id.includes('002')) return 'wave';
  if (id.includes('003')) return 'stele';
  if (id.includes('004')) return 'bust';
  if (id.includes('005')) return 'swirl';
  if (id.includes('006')) return 'army';
  if (id.includes('007')) return 'terrace';
  return 'compass';
}

const GOLD = '#d8b86d';

function motifArt(motif: Motif): string {
  switch (motif) {
    case 'wave': {
      const crests = [0, 1, 2, 3, 4, 5]
        .map(
          (i) =>
            `<path d="M0 ${360 + i * 36} Q 120 ${300 + i * 36} 240 ${360 + i * 36} T 480 ${360 + i * 36} T 720 ${360 + i * 36} T 960 ${360 + i * 36}" fill="none" stroke="#9fc7ba" stroke-opacity="${0.5 - i * 0.06}" stroke-width="1.4"/>`
        )
        .join('');
      return `<circle cx="560" cy="210" r="120" fill="#efe6d2" opacity=".9"/><path d="M0 330 C 160 150 300 120 372 214 C 330 184 290 196 296 236 C 330 224 340 262 310 292 C 440 270 520 330 600 360 L 800 360 L 800 600 L 0 600 Z" fill="#1f4e46"/><path d="M0 420 Q 200 340 400 430 T 800 410 L 800 600 L 0 600 Z" fill="#143a34"/>${crests}`;
    }
    case 'stele':
      return `<rect x="270" y="90" width="260" height="400" rx="130" ry="130" fill="#2b261e" stroke="${GOLD}" stroke-width="2"/><rect x="290" y="110" width="220" height="360" rx="112" fill="none" stroke="${GOLD}" stroke-opacity=".35"/>${[190, 235, 280, 325, 370, 415]
        .map(
          (y, i) =>
            `<path d="M310 ${y} h${40 + ((i * 37) % 60)} m14 0 h${20 + ((i * 53) % 50)} m14 0 h${30 + ((i * 29) % 40)}" stroke="${GOLD}" stroke-width="3" stroke-linecap="round" opacity=".75"/>`
        )
        .join('')}<circle cx="400" cy="150" r="20" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="400" cy="150" r="7" fill="${GOLD}"/>`;
    case 'bust':
      return `<path d="M250 520 C 260 420 330 400 350 380 L 350 340 C 310 330 300 270 316 220 C 330 150 380 100 430 110 C 470 118 490 150 484 190 L 560 120 L 540 200 C 548 260 520 320 470 340 L 470 380 C 500 400 560 420 570 520 Z" fill="#c9b184" opacity=".92"/><path d="M430 110 C 470 118 490 150 484 190 L 560 120 L 540 200" fill="none" stroke="#6d5a38" stroke-width="2"/><path d="M350 340 C 380 360 440 360 470 340" fill="none" stroke="#6d5a38" stroke-width="2"/><path d="M316 220 C 340 250 380 262 410 250" fill="none" stroke="#6d5a38" stroke-width="1.5"/>`;
    case 'swirl': {
      const spirals = [
        [260, 230, 70], [400, 190, 90], [540, 250, 60],
      ]
        .map(([cx, cy, r]) => {
          let d = `M${cx} ${cy}`;
          for (let a = 0; a < 6.3 * 2.2; a += 0.35) {
            const rr = (r * a) / (6.3 * 2.2);
            d += ` L${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
          }
          return `<path d="${d}" fill="none" stroke="#f0d99a" stroke-width="3" stroke-opacity=".85" stroke-linecap="round"/>`;
        })
        .join('');
      const stars = [[120, 120], [660, 110], [700, 260], [100, 300], [610, 330]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#f0d99a" opacity=".9"/><circle cx="${x}" cy="${y}" r="26" fill="none" stroke="#f0d99a" stroke-opacity=".3"/>`)
        .join('');
      return `${spirals}${stars}<path d="M0 430 L120 400 L170 330 L220 420 L300 380 L380 440 L800 430 L800 600 L0 600 Z" fill="#102a28"/><path d="M630 600 L650 380 L680 600 Z" fill="#0a1a18"/>`;
    }
    case 'army':
      return [0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => {
          const x = 110 + col * 90 + (row % 2) * 20;
          const y = 190 + row * 80;
          const s = 0.7 + row * 0.12;
          return `<g transform="translate(${x} ${y}) scale(${s})" fill="#b5a07b" opacity="${0.5 + row * 0.15}"><circle cx="0" cy="0" r="9"/><path d="M-13 12 h26 l8 56 h-42 z"/></g>`;
        }).join('')
      ).join('') + `<path d="M0 520 H800" stroke="${GOLD}" stroke-opacity=".3"/>`;
    case 'terrace': {
      const steps = [0, 1, 2, 3, 4, 5]
        .map((i) => `<path d="M${40 + i * 40} ${470 - i * 52} H${760 - i * 40} V${520 - i * 52} H${40 + i * 40} Z" fill="${['#1f3a2e', '#26473a', '#2d5446', '#356152', '#3f6f5e', '#4a7d6a'][i]}" stroke="#0b1311" stroke-opacity=".5"/>`)
        .join('');
      return `<path d="M0 330 L130 150 L250 270 L340 120 L470 290 L560 170 L800 330 V600 H0 Z" fill="#0f241d" opacity=".9"/>${steps}<path d="M360 470 L400 150 L440 470 Z" fill="${GOLD}" opacity=".18"/>`;
    }
    default:
      return `<circle cx="400" cy="270" r="180" fill="none" stroke="#3a4c44" stroke-width="2"/><circle cx="400" cy="270" r="120" fill="none" stroke="#3a4c44" stroke-dasharray="4 4"/><path d="M400 70 V470 M200 270 H600" stroke="#3a4c44"/><polygon points="400 200 418 270 400 258 382 270" fill="#89b399"/><polygon points="400 340 418 270 400 282 382 270" fill="#3a4c44"/>`;
  }
}

/**
 * Procedural, palette-matched artwork used when a museum CDN is unreachable
 * or a record has no media. Each cultural family gets its own motif.
 */
export function getArtworkFallbackSvg(id: string, title: string): string {
  const motif = motifFor(id);
  const dark = motif === 'bust' || motif === 'stele';
  const bg = dark ? ['#1c1813', '#0f0d0a'] : ['#10211c', '#08120f'];
  const lines = wrapTitle(title);
  const caption = lines
    .map(
      (l, i) =>
        `<text x="40" y="${548 + i * 22}" fill="#cfd6cd" fill-opacity=".85" font-family="Georgia, serif" font-style="italic" font-size="17">${escapeXml(l)}</text>`
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient></defs><rect width="800" height="600" fill="url(#g)"/>${motifArt(motif)}<rect x="14" y="14" width="772" height="572" fill="none" stroke="${GOLD}" stroke-opacity=".35"/><text x="40" y="52" fill="${GOLD}" fill-opacity=".8" font-family="Georgia, serif" font-size="13" letter-spacing="5">ORIGLYPH · ARCHIVE PLATE</text>${caption}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
