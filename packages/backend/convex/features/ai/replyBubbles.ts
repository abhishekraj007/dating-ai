/**
 * Splits an assistant reply into chat bubbles.
 *
 * Shared by the native chat UI (`useMessages`) and the Telegram delivery
 * pipeline so both clients render multi-message replies identically.
 */

const MAX_REPLY_BUBBLES = 3;
const LIST_ITEM_START = /^\s*(?:[-*+]|\d+\.)\s/;

export function splitReplyIntoBubbles(text: string): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];
  let inFence = false;

  for (const line of text.trim().split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence && line.trim() === "") {
      if (current.length > 0) {
        paragraphs.push(current.join("\n"));
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    paragraphs.push(current.join("\n"));
  }

  const bubbles: string[] = [];
  for (const paragraph of paragraphs) {
    if (bubbles.length > 0 && LIST_ITEM_START.test(paragraph)) {
      bubbles[bubbles.length - 1] += `\n\n${paragraph}`;
    } else {
      bubbles.push(paragraph);
    }
  }

  if (bubbles.length === 0) {
    return [text];
  }

  return bubbles.length <= MAX_REPLY_BUBBLES
    ? bubbles
    : [
        ...bubbles.slice(0, MAX_REPLY_BUBBLES - 1),
        bubbles.slice(MAX_REPLY_BUBBLES - 1).join("\n\n"),
      ];
}
