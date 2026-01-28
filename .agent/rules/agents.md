---
trigger: always_on
---

# Important

- Divide logics and UI into hooks and components.
- Keep files and component maintable and shorts, devide into multiple if required.
- Always seperate UI and logics into components and hooks.
- Do not use useCallback unless necessary.
- Write layout and components that should work in both light and dark mode.
- Layout and components should be mobile first and responsive.
- Do not write documentation .md file untill neccessary and it's a big feature.

- **ALWAYS check heroui-native MCP server for available components before using native React Native components**
- Prefer heroui-native components over native components when available (Button over Pressable, TextField over TextInput, Avatar for avatars, Card for cards, etc.)
- Use heroui-native list_components tool to see all available components before implementing UI
- **ALWAYS use expo-image for images in native apps** - provides caching, prefetching, and better performance. Use `cachePolicy="memory-disk"`, `contentFit="cover"`, and `transition` for smooth loading.
- **ALWAYS check relevant skills before starting any related task:**
  - For React Native/Expo UI work: check `building-native-ui`, `react-native-best-practices`, `vercel-react-native-skills`
  - For Convex backend work: check `convex`, `convex-functions`, `convex-agents`, `convex-best-practices`, and other convex-\* skills
  - For web UI work: check `web-design-guidelines`, `vercel-react-best-practices`
  - For feature planning: check `avoid-feature-creep`
  - Skills are located in `.agent/skills/` - read the SKILL.md file for each relevant skill
- **ALWAYS check heroui-react MCP server for available components before using shadcn-ui components**
- use heroui-react and shadcn-ui for web components and screens development
- use Use shadcn CLI for installing any new web components
- never create markdown (`.md`) files after you're done unless it's a big feature and planning is required. NEVER!
- never user emojis in your replies.
- check convex rules and docs if you're working on convex based projects and not sure about something. For complex convex bugs/implementation, use convex MCP or exa search tool to access latest docs.
- Always make sure code you write is secure and not hackable
- **ALWAYS Only make changes that are directly requested. Keep solutions simple and focused.**
- **ALWAYS read and understand relevant files before proposing edits. Do not speculate about code you have not inspected.**
