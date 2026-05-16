"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { toPng } from "html-to-image";
import { Download, ImageIcon, Smartphone, Tablet } from "lucide-react";

const ROOT = "/store-screenshots";

const W = 1284;
const H = 2778;
const IPAD_W = 2064;
const IPAD_H = 2752;
const AW = 1080;
const AH = 1920;
const FGW = 1024;
const FGH = 500;

const MK_W = 1022;
const MK_H = 2082;
const SC_L = (52 / MK_W) * 100;
const SC_T = (46 / MK_H) * 100;
const SC_W = (918 / MK_W) * 100;
const SC_H = (1990 / MK_H) * 100;
const SC_RX = (126 / 918) * 100;
const SC_RY = (126 / 1990) * 100;
const MK_RATIO = MK_W / MK_H;

const LOCALES = ["en"] as const;
type Locale = (typeof LOCALES)[number];

type Device = "iphone" | "ipad" | "android" | "feature-graphic";

const IPHONE_SIZES = [
  { label: "App Store 1284x2778", w: 1284, h: 2778 },
  { label: "App Store 1242x2688", w: 1242, h: 2688 },
] as const;

const IPAD_SIZES = [
  { label: "App Store 2064x2752", w: 2064, h: 2752 },
  { label: "App Store 2048x2732", w: 2048, h: 2732 },
] as const;

const ANDROID_SIZES = [{ label: "Phone", w: 1080, h: 1920 }] as const;
const FG_SIZES = [{ label: "Feature Graphic", w: 1024, h: 500 }] as const;

const THEMES = {
  "maroon-rose": {
    name: "Maroon Rose",
    bg: "#17070d",
    bg2: "#45101f",
    fg: "#fff4f7",
    muted: "#f6adc1",
    soft: "#ffd7e2",
    ink: "#16070c",
    accent: "#ec4899",
    accent2: "#9f1239",
    accent3: "#f973a9",
    line: "rgba(255, 214, 226, 0.24)",
  },
  "blush-paper": {
    name: "Blush Paper",
    bg: "#fff1f4",
    bg2: "#f9d6df",
    fg: "#260a12",
    muted: "#8b3a50",
    soft: "#ffffff",
    ink: "#2d0b15",
    accent: "#e11d75",
    accent2: "#be123c",
    accent3: "#fb7185",
    line: "rgba(139, 58, 80, 0.16)",
  },
  "night-pulse": {
    name: "Night Pulse",
    bg: "#070407",
    bg2: "#230712",
    fg: "#fff7fb",
    muted: "#d6a1b4",
    soft: "#ffd6e4",
    ink: "#090407",
    accent: "#f43f8f",
    accent2: "#7f1d1d",
    accent3: "#fb7185",
    line: "rgba(255, 255, 255, 0.16)",
  },
} as const;

type ThemeId = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeId];
type SizeDef = { label: string; w: number; h: number };
type WidthFn = (cW: number, cH: number) => number;
type FrameProps = { src: string; alt: string; style?: CSSProperties };
type FrameComponent = (props: FrameProps) => ReactElement;
type SlideProps = {
  cW: number;
  cH: number;
  basePath: string;
  theme: Theme;
  renderMode: "preview" | "export";
};
type SlideDef = {
  id: string;
  title: string;
  component: (props: SlideProps) => ReactElement;
};

const screenshotNames = [
  "for-you",
  "explore",
  "chat",
  "swipe",
  "ask-for-image",
] as const;
const alwaysSlideShots = ["for-you", "explore", "chat"] as const;
const screenshotBases = [
  `${ROOT}/screenshots/apple/iphone/en`,
  `${ROOT}/screenshots/apple/ipad/en`,
  `${ROOT}/screenshots/android/phone/en`,
];

const IMAGE_PATHS = [
  `${ROOT}/mockup.png`,
  `${ROOT}/app-icon.png`,
  ...screenshotBases.flatMap((base) =>
    screenshotNames.map((name) => `${base}/${name}.png`),
  ),
];

const imageCache: Record<string, string> = {};

function img(path: string): string {
  return imageCache[path] ?? path;
}

async function preloadAllImages() {
  await Promise.all(
    IMAGE_PATHS.map(async (path) => {
      if (imageCache[path]) {
        return;
      }
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Unable to load ${path}`);
      }
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      imageCache[path] = dataUrl;
    }),
  );
}

function phoneW(cW: number, cH: number, clamp = 0.84) {
  return Math.min(clamp, 0.72 * (cH / cW) * MK_RATIO);
}

function phoneW2(cW: number, cH: number) {
  return phoneW(cW, cH, 0.62);
}

function ipadPhoneW(cW: number, cH: number) {
  return Math.min(0.56, 0.58 * (cH / cW) * MK_RATIO);
}

function ipadPhoneW2(cW: number, cH: number) {
  return Math.min(0.42, 0.48 * (cH / cW) * MK_RATIO);
}

function getBasePath(device: Device, locale: Locale) {
  if (device === "android") {
    return `${ROOT}/screenshots/android/phone/${locale}`;
  }
  if (device === "ipad") {
    return `${ROOT}/screenshots/apple/ipad/${locale}`;
  }
  return `${ROOT}/screenshots/apple/iphone/${locale}`;
}

function getDeviceConfig(device: Device) {
  if (device === "android") {
    return { cW: AW, cH: AH, sizes: ANDROID_SIZES, label: "Android Phone" };
  }
  if (device === "ipad") {
    return { cW: IPAD_W, cH: IPAD_H, sizes: IPAD_SIZES, label: "Apple iPad" };
  }
  if (device === "feature-graphic") {
    return { cW: FGW, cH: FGH, sizes: FG_SIZES, label: "Play Feature Graphic" };
  }
  return { cW: W, cH: H, sizes: IPHONE_SIZES, label: "Apple iPhone" };
}

function getFrame(device: Device): FrameComponent {
  return device === "android" ? AndroidPhone : Phone;
}

function getWidthFn(device: Device): WidthFn {
  return device === "ipad" ? ipadPhoneW : phoneW;
}

function getWidthFn2(device: Device): WidthFn {
  return device === "ipad" ? ipadPhoneW2 : phoneW2;
}

function waitForFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function captureSlide(
  el: HTMLElement,
  sourceW: number,
  sourceH: number,
  targetW: number,
  targetH: number,
) {
  const previousLeft = el.style.left;
  const previousOpacity = el.style.opacity;
  const previousZIndex = el.style.zIndex;

  el.style.left = "0px";
  el.style.opacity = "1";
  el.style.zIndex = "-1";
  await waitForFrame();

  const options = {
    width: sourceW,
    height: sourceH,
    canvasWidth: targetW,
    canvasHeight: targetH,
    pixelRatio: 1,
    cacheBust: true,
    skipAutoScale: true,
    backgroundColor: "#090407",
  };

  await toPng(el, options);
  const dataUrl = await toPng(el, options);

  el.style.left = previousLeft;
  el.style.opacity = previousOpacity;
  el.style.zIndex = previousZIndex;
  return dataUrl;
}

function downloadPng(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function Phone({ src, alt, style }: FrameProps) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: `${MK_W}/${MK_H}`,
        filter: "drop-shadow(0 28px 56px rgba(0, 0, 0, 0.42))",
        ...style,
      }}
    >
      <img
        src={img(`${ROOT}/mockup.png`)}
        alt=""
        draggable={false}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          overflow: "hidden",
          left: `${SC_L}%`,
          top: `${SC_T}%`,
          width: `${SC_W}%`,
          height: `${SC_H}%`,
          borderRadius: `${SC_RX}% / ${SC_RY}%`,
          background: "#050505",
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
      </div>
    </div>
  );
}

function AndroidPhone({ src, alt, style }: FrameProps) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "9/19.5",
        filter: "drop-shadow(0 28px 56px rgba(0, 0, 0, 0.44))",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8% / 4%",
          background: "linear-gradient(160deg, #2a2a2e 0%, #18181b 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 40px rgba(0, 0, 0, 0.55)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1.5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "3%",
            height: "1.4%",
            borderRadius: "50%",
            background: "#0d0d0f",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            zIndex: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "3.5%",
            top: "2%",
            width: "93%",
            height: "96%",
            borderRadius: "5.5% / 2.6%",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function RibbonField({ theme }: { theme: Theme }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.055) 0 2px, transparent 2px 34px)",
          opacity: 0.42,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-18%",
          top: "9%",
          width: "142%",
          height: "22%",
          transform: "rotate(-11deg)",
          background: `linear-gradient(90deg, transparent, ${theme.accent}44, ${theme.soft}22, transparent)`,
          borderTop: `1px solid ${theme.line}`,
          borderBottom: `1px solid ${theme.line}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-18%",
          bottom: "14%",
          width: "126%",
          height: "18%",
          transform: "rotate(8deg)",
          background: `linear-gradient(90deg, transparent, ${theme.accent2}66, ${theme.accent3}38, transparent)`,
          borderTop: `1px solid ${theme.line}`,
          borderBottom: `1px solid ${theme.line}`,
        }}
      />
    </>
  );
}

function CanvasShell({
  cW,
  cH,
  theme,
  tone = "dark",
  children,
}: {
  cW: number;
  cH: number;
  theme: Theme;
  tone?: "dark" | "light";
  children: ReactNode;
}) {
  const isLight = tone === "light";
  return (
    <div
      style={{
        width: cW,
        height: cH,
        position: "relative",
        overflow: "hidden",
        color: isLight ? theme.ink : theme.fg,
        background: isLight
          ? `linear-gradient(160deg, ${theme.bg} 0%, ${theme.soft} 48%, ${theme.bg2} 100%)`
          : `linear-gradient(160deg, ${theme.bg} 0%, ${theme.bg2} 58%, #070306 100%)`,
        fontFamily:
          '"Avenir Next", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <RibbonField theme={theme} />
      {children}
    </div>
  );
}

function Caption({
  cW,
  label,
  headline,
  subline,
  theme,
  color,
  compact = false,
}: {
  cW: number;
  label: string;
  headline: ReactNode;
  subline?: string;
  theme: Theme;
  color?: string;
  compact?: boolean;
}) {
  // Headings always render in pure white per design spec.
  const headlineColor = "#ffffff";
  return (
    <div style={{ position: "relative", zIndex: 4 }}>
      <div
        style={{
          color: theme.accent3,
          fontSize: cW * (compact ? 0.021 : 0.026),
          fontWeight: 800,
          letterSpacing: 0,
          marginBottom: cW * 0.018,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: headlineColor,
          fontSize: cW * (compact ? 0.074 : 0.094),
          fontWeight: 900,
          lineHeight: 0.96,
          letterSpacing: 0,
          textShadow: "0 10px 30px rgba(0, 0, 0, 0.32)",
        }}
      >
        {headline}
      </div>
      {subline ? (
        <div
          style={{
            marginTop: cW * 0.035,
            maxWidth: cW * 0.68,
            color: color ? theme.muted : "rgba(255, 244, 247, 0.74)",
            fontSize: cW * (compact ? 0.025 : 0.032),
            fontWeight: 650,
            lineHeight: 1.26,
            letterSpacing: 0,
          }}
        >
          {subline}
        </div>
      ) : null}
    </div>
  );
}

function AppIcon({
  cW,
  size,
  style,
}: {
  cW: number;
  size?: number;
  style?: CSSProperties;
}) {
  const iconSize = size ?? cW * 0.13;
  return (
    <img
      src={img(`${ROOT}/app-icon.png`)}
      alt="FeelChat app icon"
      draggable={false}
      style={{
        width: iconSize,
        height: iconSize,
        borderRadius: iconSize * 0.24,
        objectFit: "cover",
        boxShadow:
          "0 20px 50px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.35)",
        ...style,
      }}
    />
  );
}

function GlassPill({
  cW,
  children,
  theme,
  light = false,
  fontSize,
  renderMode = "preview",
}: {
  cW: number;
  children: ReactNode;
  theme: Theme;
  light?: boolean;
  fontSize?: number;
  renderMode?: "preview" | "export";
}) {
  const isExport = renderMode === "export";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: cW * 0.04,
        border: `1px solid ${light ? "rgba(38, 10, 18, 0.12)" : theme.line}`,
        background: light
          ? isExport
            ? "rgba(255, 255, 255, 0.84)"
            : "rgba(255, 255, 255, 0.72)"
          : isExport
            ? "rgba(255, 255, 255, 0.16)"
            : "rgba(255, 255, 255, 0.1)",
        color: light ? theme.ink : theme.fg,
        padding: `${cW * 0.014}px ${cW * 0.028}px`,
        fontSize: fontSize ?? cW * 0.028,
        fontWeight: 800,
        lineHeight: 1,
        boxShadow: "0 18px 38px rgba(0, 0, 0, 0.16)",
        backdropFilter: isExport ? "none" : "blur(16px)",
      }}
    >
      {children}
    </div>
  );
}

function makeHeroSlide(Frame: FrameComponent, widthFn: WidthFn): SlideDef {
  return {
    id: "hero-real-conversations",
    title: "Hero",
    component: ({ cW, cH, basePath, theme, renderMode }) => {
      const frameW = widthFn(cW, cH) * 100;
      return (
        <CanvasShell cW={cW} cH={cH} theme={theme}>
          <AppIcon
            cW={cW}
            style={{
              position: "absolute",
              top: cW * 0.08,
              right: cW * 0.08,
              zIndex: 5,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: cH * 0.075,
              left: cW * 0.08,
              zIndex: 6,
            }}
          >
            <Caption
              cW={cW}
              label="FeelChat"
              headline={
                <>
                  Meet AI
                  <br />
                  characters
                  <br />
                  who feel real.
                </>
              }
              subline="Swipe into conversations with personality, rhythm, and a little spark."
              theme={theme}
            />
          </div>
          <Frame
            src={img(`${basePath}/for-you.png`)}
            alt="For You screen"
            style={{
              position: "absolute",
              width: `${frameW}%`,
              left: "50%",
              bottom: cH * -0.035,
              transform: "translateX(-50%)",
              zIndex: 3,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: cW * 0.08,
              bottom: cH * 0.06,
              zIndex: 6,
              display: "flex",
              gap: cW * 0.018,
              flexWrap: "wrap",
              width: cW * 0.5,
            }}
          >
            <GlassPill cW={cW} theme={theme} renderMode={renderMode}>
              Real talk
            </GlassPill>
            <GlassPill cW={cW} theme={theme} renderMode={renderMode}>
              Always on
            </GlassPill>
          </div>
        </CanvasShell>
      );
    },
  };
}

function makeSwipeSlide(
  Frame: FrameComponent,
  widthFn: WidthFn,
  _widthFn2: WidthFn,
): SlideDef {
  void _widthFn2;
  return {
    id: "find-your-spark",
    title: "Swipe",
    component: ({ cW, cH, basePath, theme, renderMode }) => {
      const frameW = widthFn(cW, cH) * 100;
      return (
        <CanvasShell cW={cW} cH={cH} theme={theme}>
          <div
            style={{
              position: "absolute",
              top: cH * 0.075,
              left: cW * 0.08,
              width: cW * 0.78,
              zIndex: 8,
            }}
          >
            <Caption
              cW={cW}
              label="Discover"
              headline={
                <>
                  Find your
                  <br />
                  kind of spark.
                </>
              }
              subline="Profiles feel cinematic before the first message."
              theme={theme}
            />
          </div>
          <Frame
            src={img(`${basePath}/swipe.png`)}
            alt="Swipe screen"
            style={{
              position: "absolute",
              width: `${frameW}%`,
              left: "50%",
              bottom: cH * -0.04,
              transform: "translateX(-50%) rotate(-2deg)",
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: cW * 0.05,
              top: cH * 0.39,
              zIndex: 9,
              borderRadius: cW * 0.05,
              padding: `${cW * 0.025}px ${cW * 0.038}px`,
              background: theme.accent,
              color: "#ffffff",
              fontSize: cW * 0.034,
              fontWeight: 800,
              boxShadow: `0 24px 48px ${theme.accent}55`,
              transform: "rotate(8deg)",
            }}
          >
            Liked
          </div>

          <div
            style={{
              position: "absolute",
              left: cW * 0.03,
              bottom: cH * 0.4,
              zIndex: 9,
              display: "flex",
              gap: cW * 0.018,
              flexWrap: "wrap",
              flexDirection: "column",
            }}
          >
            <GlassPill
              fontSize={42}
              cW={cW}
              theme={theme}
              renderMode={renderMode}
            >
              Swipe
            </GlassPill>
            <GlassPill
              fontSize={42}
              cW={cW}
              theme={theme}
              renderMode={renderMode}
            >
              Match
            </GlassPill>
            <GlassPill
              fontSize={42}
              cW={cW}
              theme={theme}
              renderMode={renderMode}
            >
              Chat
            </GlassPill>
          </div>
        </CanvasShell>
      );
    },
  };
}

function makeExploreSlide(Frame: FrameComponent, widthFn: WidthFn): SlideDef {
  return {
    id: "many-new-moods",
    title: "Explore",
    component: ({ cW, cH, basePath, theme, renderMode }) => {
      const frameW = widthFn(cW, cH) * 100;
      const moods = [
        { label: "Slow burn", hint: "Soft, lingering" },
        { label: "Flirty", hint: "Light and playful" },
        { label: "Cozy", hint: "Warm and easy" },
        { label: "Playful", hint: "Tease, laugh, repeat" },
      ];
      return (
        <CanvasShell cW={cW} cH={cH} theme={theme}>
          <div
            style={{
              position: "absolute",
              top: cH * 0.075,
              left: cW * 0.08,
              width: cW * 0.84,
              zIndex: 8,
            }}
          >
            <Caption
              cW={cW}
              label="Explore"
              headline={
                <>
                  A room full
                  <br />
                  of new moods.
                </>
              }
              subline="Pick the energy you want tonight."
              theme={theme}
            />
          </div>
          <Frame
            src={img(`${basePath}/explore.png`)}
            alt="Explore grid"
            style={{
              position: "absolute",
              width: `${frameW}%`,
              right: cW * -0.06,
              bottom: cH * -0.04,
              transform: "rotate(3deg)",
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: cW * 0.06,
              top: cH * 0.4,
              width: cW * 0.46,
              zIndex: 9,
              display: "grid",
              gap: cW * 0.022,
            }}
          >
            {moods.map((mood) => (
              <div
                key={mood.label}
                style={{
                  borderRadius: cW * 0.05,
                  padding: `${cW * 0.024}px ${cW * 0.032}px`,
                  background:
                    renderMode === "export"
                      ? "rgba(255, 255, 255, 0.16)"
                      : "rgba(255, 255, 255, 0.1)",
                  border: `1px solid ${theme.line}`,
                  backdropFilter:
                    renderMode === "export" ? "none" : "blur(18px)",
                  boxShadow: "0 22px 44px rgba(0, 0, 0, 0.32)",
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: cW * 0.034,
                    fontWeight: 850,
                    lineHeight: 1,
                  }}
                >
                  {mood.label}
                </div>
                <div
                  style={{
                    marginTop: cW * 0.008,
                    color: "rgba(255, 244, 247, 0.7)",
                    fontSize: cW * 0.022,
                    fontWeight: 600,
                  }}
                >
                  {mood.hint}
                </div>
              </div>
            ))}
          </div>
        </CanvasShell>
      );
    },
  };
}

function MessageCard({
  cW,
  text,
  theme,
  sent = false,
  style,
  renderMode = "preview",
}: {
  cW: number;
  text: string;
  theme: Theme;
  sent?: boolean;
  style?: CSSProperties;
  renderMode?: "preview" | "export";
}) {
  const isExport = renderMode === "export";
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 7,
        maxWidth: cW * 0.62,
        borderRadius: cW * 0.045,
        padding: `${cW * 0.026}px ${cW * 0.034}px`,
        background: sent
          ? theme.accent
          : isExport
            ? "rgba(255, 255, 255, 0.18)"
            : "rgba(255, 255, 255, 0.12)",
        border: sent ? "none" : `1px solid ${theme.line}`,
        color: theme.fg,
        fontSize: cW * 0.034,
        fontWeight: 760,
        lineHeight: 1.14,
        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.28)",
        backdropFilter: isExport ? "none" : "blur(18px)",
        ...style,
      }}
    >
      {text}
    </div>
  );
}

function makeChatSlide(Frame: FrameComponent, widthFn: WidthFn): SlideDef {
  return {
    id: "chat-that-listens",
    title: "Chat",
    component: ({ cW, cH, basePath, theme, renderMode }) => {
      const frameW = widthFn(cW, cH) * 100;
      return (
        <CanvasShell cW={cW} cH={cH} theme={theme}>
          <div
            style={{
              position: "absolute",
              top: cH * 0.07,
              left: cW * 0.08,
              width: cW * 0.84,
              zIndex: 8,
            }}
          >
            <Caption
              cW={cW}
              label="Conversation"
              headline={
                <>
                  Ask and they
                  <br />
                  send a moment.
                </>
              }
              subline="Replies feel close, warm, and in character."
              theme={theme}
            />
          </div>
          <Frame
            src={img(`${basePath}/ask-for-image.png`)}
            alt="Chat screen"
            style={{
              position: "absolute",
              width: `${frameW}%`,
              left: "50%",
              bottom: cH * -0.045,
              transform: "translateX(-50%) rotate(2deg)",
              zIndex: 3,
            }}
          />
          <MessageCard
            cW={cW}
            text="Send me a pic?"
            theme={theme}
            sent
            renderMode={renderMode}
            style={{ right: cW * 0.05, top: cH * 0.4 }}
          />
          <MessageCard
            cW={cW}
            text="One sec, smiling for you."
            theme={theme}
            renderMode={renderMode}
            style={{ left: cW * 0.05, top: cH * 0.5 }}
          />
        </CanvasShell>
      );
    },
  };
}

function makeQuizSlide(Frame: FrameComponent, widthFn: WidthFn): SlideDef {
  return {
    id: "little-games",
    title: "Quiz",
    component: ({ cW, cH, basePath, theme }) => {
      const frameW = widthFn(cW, cH) * 100;
      return (
        <CanvasShell cW={cW} cH={cH} theme={theme}>
          <div
            style={{
              position: "absolute",
              top: cH * 0.075,
              left: cW * 0.08,
              width: cW * 0.76,
              zIndex: 8,
            }}
          >
            <Caption
              cW={cW}
              label="Quiz"
              headline={
                <>
                  Turn chats
                  <br />
                  into little games.
                </>
              }
              subline="Play, tease, guess, and keep the conversation moving."
              theme={theme}
            />
          </div>
          <Frame
            src={img(`${basePath}/chat.png`)}
            alt="Quiz screen"
            style={{
              position: "absolute",
              width: `${frameW}%`,
              left: cW * -0.05,
              bottom: cH * -0.05,
              transform: "rotate(-5deg)",
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: cW * 0.06,
              top: cH * 0.47,
              width: cW * 0.48,
              zIndex: 8,
              display: "grid",
              gap: cW * 0.026,
            }}
          >
            {["Guess her vibe", "Pick a topic", "Play a game"].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: cW * 0.05,
                  padding: `${cW * 0.028}px ${cW * 0.034}px`,
                  background: "rgba(255, 255, 255, 0.82)",
                  border: "1px solid rgba(38, 10, 18, 0.12)",
                  color: theme.ink,
                  fontSize: cW * 0.03,
                  fontWeight: 850,
                  boxShadow: "0 18px 38px rgba(80, 24, 42, 0.16)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </CanvasShell>
      );
    },
  };
}

function makeAlwaysSlide(): SlideDef {
  return {
    id: "always-ready",
    title: "Always",
    component: ({ cW, cH, basePath, theme, renderMode }) => {
      return (
        <CanvasShell cW={cW} cH={cH} theme={theme}>
          <div
            style={{
              position: "absolute",
              top: cH * 0.09,
              left: cW * 0.08,
              right: cW * 0.08,
              zIndex: 9,
            }}
          >
            <AppIcon cW={cW} size={cW * 0.16} />
            <div style={{ marginTop: cW * 0.07 }}>
              <Caption
                cW={cW}
                label="FeelChat"
                headline={
                  <>
                    Always someone
                    <br />
                    ready to talk.
                  </>
                }
                subline="A private place for sparks, stories, and late-night energy."
                theme={theme}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: cW * 0.018,
                flexWrap: "wrap",
                marginTop: cW * 0.06,
                maxWidth: cW * 0.72,
              }}
            >
              {[
                "AI characters",
                "Photo requests",
                "Quizzes",
                "Custom chats",
                "Premium moments",
              ].map((item) => (
                <GlassPill
                  key={item}
                  cW={cW}
                  theme={theme}
                  renderMode={renderMode}
                >
                  {item}
                </GlassPill>
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: cW * 0.08,
              right: cW * 0.08,
              bottom: cH * 0.08,
              height: cH * 0.36,
              zIndex: 5,
            }}
          >
            {alwaysSlideShots.map((name, index) => (
              <img
                key={name}
                src={img(`${basePath}/${name}.png`)}
                alt={`${name} app preview`}
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${index * 28}%`,
                  top: index === 1 ? "4%" : "17%",
                  width: "44%",
                  height: "88%",
                  objectFit: "cover",
                  objectPosition: "top",
                  borderRadius: cW * 0.04,
                  border: `1px solid ${theme.line}`,
                  boxShadow: "0 28px 58px rgba(0, 0, 0, 0.36)",
                  transform: `rotate(${index === 0 ? -7 : index === 1 ? 1 : 7}deg)`,
                }}
              />
            ))}
          </div>
        </CanvasShell>
      );
    },
  };
}

function buildSlides(device: Device): SlideDef[] {
  if (device === "feature-graphic") {
    return [FEATURE_GRAPHIC_SLIDE];
  }
  const Frame = getFrame(device);
  const widthFn = getWidthFn(device);
  const widthFn2 = getWidthFn2(device);
  return [
    makeHeroSlide(Frame, widthFn),
    makeSwipeSlide(Frame, widthFn, widthFn2),
    makeExploreSlide(Frame, widthFn),
    makeChatSlide(Frame, widthFn),
    makeQuizSlide(Frame, widthFn),
    makeAlwaysSlide(),
  ];
}

const FEATURE_GRAPHIC_SLIDE: SlideDef = {
  id: "play-feature-graphic",
  title: "Feature Graphic",
  component: ({ cW, cH, basePath, theme }) => (
    <div
      style={{
        width: cW,
        height: cH,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg2} 58%, #070306 100%)`,
        color: theme.fg,
        fontFamily:
          '"Avenir Next", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <RibbonField theme={theme} />
      <div
        style={{
          position: "absolute",
          left: cW * 0.065,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 8,
          display: "flex",
          alignItems: "center",
          gap: cW * 0.032,
        }}
      >
        <AppIcon cW={cW} size={cW * 0.13} />
        <div>
          <div
            style={{
              fontSize: cW * 0.064,
              fontWeight: 950,
              lineHeight: 0.95,
              letterSpacing: 0,
            }}
          >
            FeelChat
          </div>
          <div
            style={{
              marginTop: cW * 0.014,
              color: theme.muted,
              fontSize: cW * 0.027,
              fontWeight: 800,
            }}
          >
            AI characters that feel real.
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: cW * 0.04,
          top: cH * 0.08,
          width: cW * 0.44,
          height: cH * 0.84,
          zIndex: 5,
        }}
      >
        {screenshotNames.map((name, index) => (
          <img
            key={name}
            src={img(`${basePath}/${name}.png`)}
            alt={`${name} app preview`}
            draggable={false}
            style={{
              position: "absolute",
              left: `${index * 29}%`,
              top: index === 1 ? "0%" : "12%",
              width: "42%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              borderRadius: cW * 0.018,
              border: `1px solid ${theme.line}`,
              boxShadow: "0 22px 42px rgba(0, 0, 0, 0.38)",
              transform: `rotate(${index === 0 ? -7 : index === 1 ? 0 : 7}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  ),
};

function ScreenshotPreview({
  slide,
  cW,
  cH,
  basePath,
  theme,
  onDownload,
  downloadLabel,
  isDownloading,
  isDisabled,
}: {
  slide: SlideDef;
  cW: number;
  cH: number;
  basePath: string;
  theme: Theme;
  onDownload: () => void;
  downloadLabel: string;
  isDownloading: boolean;
  isDisabled: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.24);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const updateScale = () => {
      const width = host.clientWidth;
      setScale(Math.min(1, width / cW));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(host);
    return () => observer.disconnect();
  }, [cW]);

  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        background: "rgba(255, 255, 255, 0.06)",
        padding: 10,
        boxShadow: "0 18px 36px rgba(0, 0, 0, 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
          color: "rgba(255, 255, 255, 0.82)",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <span>{slide.title}</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* <span style={{ color: "rgba(255, 255, 255, 0.48)" }}>{slide.id}</span> */}
          <button
            type="button"
            onClick={onDownload}
            disabled={isDisabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 7,
              padding: "6px 10px",
              background: isDisabled
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.12)",
              color: isDisabled ? "rgba(255, 255, 255, 0.45)" : "#fff4f7",
              fontSize: 11,
              fontWeight: 900,
              whiteSpace: "nowrap",
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
          >
            <Download size={12} />
          </button>
        </div>
      </div>
      <div ref={hostRef} style={{ width: "100%" }}>
        <div
          style={{
            width: "100%",
            height: cH * scale,
            overflow: "hidden",
            borderRadius: 6,
            background: "#090407",
          }}
        >
          <div
            style={{
              width: cW,
              height: cH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {slide.component({
              cW,
              cH,
              basePath,
              theme,
              renderMode: "preview",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        border: "none",
        borderRadius: 8,
        padding: "7px 12px",
        background: active ? "#ffffff" : "transparent",
        color: active ? "#9f1239" : "rgba(255, 255, 255, 0.7)",
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
        boxShadow: active ? "0 8px 20px rgba(0, 0, 0, 0.18)" : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function StoreScreenshotsPage() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [device, setDevice] = useState<Device>("iphone");
  const [themeId, setThemeId] = useState<ThemeId>("maroon-rose");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRefs = useRef<Array<HTMLDivElement | null>>([]);

  const theme = THEMES[themeId];
  const { sizes, label } = getDeviceConfig(device);
  const currentSizes: readonly SizeDef[] = sizes;
  const currentSize = currentSizes[Math.min(sizeIdx, currentSizes.length - 1)];
  const cW = currentSize.w;
  const cH = currentSize.h;
  const slides = buildSlides(device);
  const basePath = getBasePath(
    device === "feature-graphic" ? "iphone" : device,
    locale,
  );

  useEffect(() => {
    let active = true;
    preloadAllImages()
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Image preload failed",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function exportSlideAtIndex(index: number) {
    const el = exportRefs.current[index];
    if (!el) {
      return;
    }

    const dataUrl = await captureSlide(
      el,
      cW,
      cH,
      currentSize.w,
      currentSize.h,
    );
    const filename = `${String(index + 1).padStart(2, "0")}-${device}-${slides[index].id}-${locale}-${currentSize.w}x${currentSize.h}.png`;
    downloadPng(dataUrl, filename);
  }

  async function exportAll() {
    if (!ready || exporting) {
      return;
    }
    setExportError(null);
    try {
      for (let index = 0; index < slides.length; index++) {
        setExporting(`${index + 1}/${slides.length}`);
        await exportSlideAtIndex(index);
        await sleep(300);
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  async function exportSingle(index: number) {
    if (!ready || exporting) {
      return;
    }

    setExportError(null);
    try {
      setExporting(slides[index].id);
      await exportSlideAtIndex(index);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  if (loadError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#090407",
          color: "white",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 560, lineHeight: 1.5 }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px", fontWeight: 900 }}>
            Could not load screenshot assets
          </h1>
          <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.74)" }}>
            {loadError}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #090407 0%, #1f0710 45%, #090407 100%)",
        color: "white",
        position: "relative",
        overflowX: "hidden",
        fontFamily:
          '"Avenir Next", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "stretch",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(9, 4, 7, 0.86)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            padding: "10px 16px",
            overflowX: "auto",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" }}>
            FeelChat Store Screenshots
          </span>
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            style={controlStyle}
          >
            {LOCALES.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={themeId}
            onChange={(event) => setThemeId(event.target.value as ThemeId)}
            style={controlStyle}
          >
            {Object.entries(THEMES).map(([id, item]) => (
              <option key={id} value={id}>
                {item.name}
              </option>
            ))}
          </select>
          <div
            style={{
              display: "flex",
              gap: 4,
              borderRadius: 10,
              padding: 4,
              background: "rgba(255, 255, 255, 0.09)",
              flexShrink: 0,
            }}
          >
            <DeviceButton
              active={device === "iphone"}
              icon={<Smartphone size={14} />}
              label="iPhone"
              onClick={() => {
                setDevice("iphone");
                setSizeIdx(0);
              }}
            />
            <DeviceButton
              active={device === "ipad"}
              icon={<Tablet size={14} />}
              label="iPad"
              onClick={() => {
                setDevice("ipad");
                setSizeIdx(0);
              }}
            />
            <DeviceButton
              active={device === "android"}
              icon={<Smartphone size={14} />}
              label="Android"
              onClick={() => {
                setDevice("android");
                setSizeIdx(0);
              }}
            />
            <DeviceButton
              active={device === "feature-graphic"}
              icon={<ImageIcon size={14} />}
              label="Feature Graphic"
              onClick={() => {
                setDevice("feature-graphic");
                setSizeIdx(0);
              }}
            />
          </div>
          <select
            value={sizeIdx}
            onChange={(event) => setSizeIdx(Number(event.target.value))}
            style={controlStyle}
          >
            {currentSizes.map((size, index) => (
              <option key={`${size.w}-${size.h}`} value={index}>
                {size.label} - {size.w}x{size.h}
              </option>
            ))}
          </select>
          <span
            style={{
              color: "rgba(255, 255, 255, 0.56)",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {label} preview at {cW}x{cH}
          </span>
        </div>
        <div
          style={{
            flexShrink: 0,
            padding: "10px 16px",
            borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <button
            type="button"
            onClick={exportAll}
            disabled={!ready || !!exporting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              background:
                !ready || exporting ? "rgba(236, 72, 153, 0.5)" : "#ec4899",
              color: "white",
              fontSize: 12,
              fontWeight: 900,
              whiteSpace: "nowrap",
              boxShadow: "0 12px 30px rgba(236, 72, 153, 0.28)",
            }}
          >
            <Download size={14} />
            {exporting
              ? `Exporting ${exporting}`
              : ready
                ? "Export All"
                : "Loading"}
          </button>
        </div>
      </div>

      <section
        style={{ maxWidth: 1480, margin: "0 auto", padding: "26px 16px 54px" }}
      >
        {exportError ? (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 8,
              border: "1px solid rgba(248, 113, 113, 0.4)",
              background: "rgba(127, 29, 29, 0.32)",
              padding: 12,
              color: "#fecaca",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {exportError}
          </div>
        ) : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
            alignItems: "start",
          }}
        >
          {slides.map((slide, index) => (
            <ScreenshotPreview
              key={slide.id}
              slide={slide}
              cW={cW}
              cH={cH}
              basePath={basePath}
              theme={theme}
              onDownload={() => {
                void exportSingle(index);
              }}
              downloadLabel={`Download ${currentSize.w}x${currentSize.h}`}
              isDownloading={exporting === slide.id}
              isDisabled={!ready || !!exporting}
            />
          ))}
        </div>
      </section>

      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {ready
          ? slides.map((slide, index) => (
              <div
                key={slide.id}
                ref={(node) => {
                  exportRefs.current[index] = node;
                }}
                style={{
                  position: "absolute",
                  left: "-9999px",
                  top: 0,
                  width: cW,
                  height: cH,
                  overflow: "hidden",
                  background: "#090407",
                }}
              >
                {slide.component({
                  cW,
                  cH,
                  basePath,
                  theme,
                  renderMode: "export",
                })}
              </div>
            ))
          : null}
      </div>
    </main>
  );
}

const controlStyle: CSSProperties = {
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: 8,
  background: "rgba(255, 255, 255, 0.08)",
  color: "white",
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
};
