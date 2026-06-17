
---
Task ID: 1
Agent: main
Task: Fix dim sidebar and sidebar scrolling out of view, plus fix faint text colors across all components

Work Log:
- Changed VertApp outer container from `min-h-screen` to `h-screen overflow-hidden` to lock viewport and prevent page-level scrolling
- Changed Header from `sticky top-0` to `shrink-0` since it's now in a fixed-height flex column
- Made Sidebar text darker: default text → `text-zinc-800`, active states use `bg-violet-50`, section headers `font-semibold text-zinc-800`
- Added `overflow-y-auto custom-scrollbar` to collapsed sidebar variant
- Fixed faint text colors across 22+ components

Stage Summary:
- Sidebar now stays fixed in place while main content scrolls independently
- All text colors now have proper contrast on light backgrounds
- No more dim/faint text throughout the application
