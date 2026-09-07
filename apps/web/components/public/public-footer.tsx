import Link from "next/link";
import Image from "next/image";
import { ANIME_ENABLED } from "@/lib/public-segments";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-card/40 pt-10 pb-12 text-sm text-muted-foreground">
      <div className="mx-auto w-full max-w-7xl px-2">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3 lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
            >
              <Image
                src="/logo-transparent.png"
                alt="FeelAI"
                width={110}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">
              FeelAI is a virtual AI companion and dating platform. Browse AI
              girlfriends and AI boyfriends for immersive conversations,
              roleplay, and friendship.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <span>18+ Adults Only</span>
              <span className="size-1 rounded-full bg-muted-foreground/40" />
              <span>Virtual AI Companions</span>
            </div>
          </div>

          {/* Browse Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Browse
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/women"
                  className="transition-colors hover:text-foreground"
                >
                  AI Girlfriends
                </Link>
              </li>
              <li>
                <Link
                  href="/men"
                  className="transition-colors hover:text-foreground"
                >
                  AI Boyfriends
                </Link>
              </li>
              {ANIME_ENABLED ? (
                <li>
                  <Link
                    href="/anime"
                    className="transition-colors hover:text-foreground"
                  >
                    Anime Companions
                  </Link>
                </li>
              ) : null}
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground"
                >
                  Explore All
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Guides
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/ai-girlfriend"
                  className="transition-colors hover:text-foreground"
                >
                  AI Girlfriend Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-boyfriend"
                  className="transition-colors hover:text-foreground"
                >
                  AI Boyfriend Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-dating-app"
                  className="transition-colors hover:text-foreground"
                >
                  AI Dating App
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-roleplay-chat"
                  className="transition-colors hover:text-foreground"
                >
                  AI Roleplay Chat
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-companion"
                  className="transition-colors hover:text-foreground"
                >
                  AI Companions
                </Link>
              </li>
            </ul>
          </div>

          {/* Company / Trust Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              About & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-foreground"
                >
                  About FeelAI
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="transition-colors hover:text-foreground"
                >
                  Safety & Ethics
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="transition-colors hover:text-foreground"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="transition-colors hover:text-foreground"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs sm:flex-row">
          <p className="text-muted-foreground">
            &copy; {currentYear} FeelAI. All rights reserved. Virtual characters
            are generated with artificial intelligence.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <span>&bull;</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <span>&bull;</span>
            <Link
              href="/safety"
              className="transition-colors hover:text-foreground"
            >
              Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
