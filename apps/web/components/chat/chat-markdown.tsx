import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div
      className={cn(
        "max-w-none break-words text-inherit",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ className: linkClassName, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                "font-medium underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current",
                linkClassName,
              )}
            />
          ),
          p: ({ className: paragraphClassName, ...props }) => (
            <p
              className={cn("my-2 leading-6", paragraphClassName)}
              {...props}
            />
          ),
          ul: ({ className: listClassName, ...props }) => (
            <ul
              className={cn("my-2 list-disc space-y-1 pl-5", listClassName)}
              {...props}
            />
          ),
          ol: ({ className: listClassName, ...props }) => (
            <ol
              className={cn("my-2 list-decimal space-y-1 pl-5", listClassName)}
              {...props}
            />
          ),
          li: ({ className: itemClassName, ...props }) => (
            <li className={cn("pl-1", itemClassName)} {...props} />
          ),
          blockquote: ({ className: blockquoteClassName, ...props }) => (
            <blockquote
              className={cn(
                "my-3 border-l-2 border-current/20 pl-4 italic text-inherit/80",
                blockquoteClassName,
              )}
              {...props}
            />
          ),
          h1: ({ className: headingClassName, ...props }) => (
            <h1
              className={cn("my-3 text-base font-semibold", headingClassName)}
              {...props}
            />
          ),
          h2: ({ className: headingClassName, ...props }) => (
            <h2
              className={cn(
                "my-3 text-[0.95rem] font-semibold",
                headingClassName,
              )}
              {...props}
            />
          ),
          h3: ({ className: headingClassName, ...props }) => (
            <h3
              className={cn("my-2 text-sm font-semibold", headingClassName)}
              {...props}
            />
          ),
          hr: ({ className: ruleClassName, ...props }) => (
            <hr
              className={cn("my-3 border-current/15", ruleClassName)}
              {...props}
            />
          ),
          table: ({ className: tableClassName, ...props }) => (
            <div className="my-3 overflow-x-auto rounded-2xl border border-current/10">
              <table
                className={cn(
                  "w-full border-collapse text-left text-xs",
                  tableClassName,
                )}
                {...props}
              />
            </div>
          ),
          thead: ({ className: headClassName, ...props }) => (
            <thead className={cn("bg-current/5", headClassName)} {...props} />
          ),
          th: ({ className: cellClassName, ...props }) => (
            <th
              className={cn(
                "border-b border-current/10 px-3 py-2 font-medium",
                cellClassName,
              )}
              {...props}
            />
          ),
          td: ({ className: cellClassName, ...props }) => (
            <td
              className={cn(
                "border-t border-current/10 px-3 py-2 align-top",
                cellClassName,
              )}
              {...props}
            />
          ),
          pre: ({ className: preClassName, ...props }) => (
            <pre
              className={cn(
                "my-3 overflow-x-auto rounded-2xl bg-black/10 px-4 py-3 text-[0.8125rem] dark:bg-white/10",
                preClassName,
              )}
              {...props}
            />
          ),
          code: ({ className: codeClassName, ...props }) => {
            const hasLanguageClass = /language-/.test(codeClassName || "");

            return (
              <code
                className={cn(
                  "font-mono text-[0.8125rem]",
                  hasLanguageClass
                    ? "bg-transparent px-0 py-0"
                    : "rounded-md bg-black/10 px-1.5 py-0.5 dark:bg-white/10",
                  codeClassName,
                )}
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
