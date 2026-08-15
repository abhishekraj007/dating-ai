import { cn } from "@/lib/utils";

export function SidebarFlyoutLabel({ children }: { children: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-[calc(100%+0.7rem)] top-1/2 z-50 -translate-y-1/2",
        "whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-[0_10px_30px_-12px_rgba(0,0,0,0.65)]",
        "origin-left scale-95 opacity-0 translate-x-1.5",
        "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] delay-0",
        "group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-75",
        "group-focus-within:translate-x-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-focus-within:delay-75",
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-foreground"
      />
      {children}
    </span>
  );
}

export function SidebarRailItem({
  showLabel,
  label,
  className,
  children,
}: {
  showLabel: boolean;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", showLabel && "group", className)}>
      {children}
      {showLabel ? <SidebarFlyoutLabel>{label}</SidebarFlyoutLabel> : null}
    </div>
  );
}
