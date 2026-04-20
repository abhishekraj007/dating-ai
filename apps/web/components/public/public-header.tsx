"use client";

import Link from "next/link";
import { Menu, Search, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { useSidebar } from "@/components/public/sidebar-context";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Girls", value: "girls" },
  { label: "Anime", value: "anime" },
  { label: "Guys", value: "guys" },
] as const;

export function PublicHeader() {
  const searchParams = useSearchParams();
  const activeSegment = searchParams.get("segment") ?? "girls";
  const { open } = useSidebar();

  return (
    <header className="sticky top-0 z-30 h-[60px] border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1600px] items-center px-4 md:px-6 lg:px-8">
        {/* Logo section — same width as sidebar on xl so tabs align with content */}
        <div className="flex items-center gap-2 xl:w-72 xl:shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="xl:hidden"
            aria-label="Open navigation"
            onClick={open}
          >
            <Menu className="size-4" />
          </Button>

          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">FeelAI</span>
          </Link>
        </div>

        {/* Gender tabs — start right where sidebar ends on desktop */}
        <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1 md:flex">
          {tabs.map((tab) => {
            const isActive = tab.value === activeSegment;
            return (
              <Button
                key={tab.value}
                asChild
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-full px-4",
                  !isActive && "text-muted-foreground",
                )}
              >
                <Link href={`/?segment=${tab.value}`}>{tab.label}</Link>
              </Button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-64 lg:block">
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <Search className="size-4" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search companions"
                placeholder="Search companions"
                readOnly
              />
            </InputGroup>
          </div>
          <ThemeToggle />
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/login">Create Free Account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
