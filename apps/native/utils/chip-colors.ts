export interface ChipTone {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

interface ChipToneBase {
  backgroundColor: string;
  borderBaseColor: string;
  textColor: string;
}

const CHIP_TONES: ChipToneBase[] = [
  { backgroundColor: "#2C1229", borderBaseColor: "#5E2555", textColor: "#FF8EDB" },
  { backgroundColor: "#2F1A0A", borderBaseColor: "#6B3A18", textColor: "#FFB66A" },
  { backgroundColor: "#122C1F", borderBaseColor: "#2C6A45", textColor: "#79F2B2" },
  { backgroundColor: "#112735", borderBaseColor: "#2F5E79", textColor: "#7FD3FF" },
  { backgroundColor: "#1E2040", borderBaseColor: "#3E4A8A", textColor: "#A8B6FF" },
  { backgroundColor: "#2A1732", borderBaseColor: "#613678", textColor: "#D39CFF" },
  { backgroundColor: "#2B1E11", borderBaseColor: "#76522A", textColor: "#F4CA85" },
  { backgroundColor: "#1B2824", borderBaseColor: "#44695F", textColor: "#A2EBDD" },
  { backgroundColor: "#1A2332", borderBaseColor: "#435E85", textColor: "#9BC6FF" },
  { backgroundColor: "#2A1A1A", borderBaseColor: "#6C3F3F", textColor: "#FF9F9F" },
  { backgroundColor: "#262014", borderBaseColor: "#64563A", textColor: "#EBD79F" },
  { backgroundColor: "#21201A", borderBaseColor: "#5B584B", textColor: "#CFCAB3" },
  { backgroundColor: "#201A2F", borderBaseColor: "#524279", textColor: "#B9A4FF" },
  { backgroundColor: "#1B2527", borderBaseColor: "#446067", textColor: "#9FDDE6" },
  { backgroundColor: "#231B23", borderBaseColor: "#634B63", textColor: "#E2B7E2" },
  { backgroundColor: "#2E1A12", borderBaseColor: "#7D4330", textColor: "#FFB8A0" },
  { backgroundColor: "#182626", borderBaseColor: "#3C6464", textColor: "#8ED8D8" },
  { backgroundColor: "#1E1E2E", borderBaseColor: "#4A4A7B", textColor: "#A9B3FF" },
  { backgroundColor: "#261D19", borderBaseColor: "#6D4E42", textColor: "#DAB8AB" },
  { backgroundColor: "#1C241C", borderBaseColor: "#4A664A", textColor: "#A8E0A8" },
  { backgroundColor: "#2A1820", borderBaseColor: "#6E3B53", textColor: "#F2A0C8" },
  { backgroundColor: "#1A212C", borderBaseColor: "#3F5879", textColor: "#9EC0F2" },
  { backgroundColor: "#251F16", borderBaseColor: "#68573B", textColor: "#E6CC98" },
  { backgroundColor: "#1C1C1C", borderBaseColor: "#4A4A4A", textColor: "#D0D0D0" },
  { backgroundColor: "#192329", borderBaseColor: "#3A6675", textColor: "#9EDAF2" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function withAlpha(hex: string, opacity: number): string {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function getChipTone(seed: string | number): ChipTone {
  const normalizedSeed =
    typeof seed === "number" ? seed.toString() : seed.trim().toLowerCase();
  const paletteIndex = hashSeed(normalizedSeed) % CHIP_TONES.length;
  const tone = CHIP_TONES[paletteIndex];
  return {
    backgroundColor: tone.backgroundColor,
    borderColor: withAlpha(tone.borderBaseColor, 0.35),
    textColor: tone.textColor,
  };
}
