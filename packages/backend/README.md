# Backend (Convex)

## Setup

### Seed Filter Options

The `filterOptions` table powers the filter UI (age ranges, genders, zodiac signs, interests). Run this once per environment to populate:

```bash
# Dev
npx convex run features/filters/queries:seedFilterOptions

# Prod
npx convex run --prod features/filters/queries:seedFilterOptions
```

If you ever need to re-seed (e.g., after adding new interests in `convex/lib/constants.ts`), pass `force: true`:

```bash
npx convex run --prod features/filters/queries:seedFilterOptions '{"force": true}'
```
