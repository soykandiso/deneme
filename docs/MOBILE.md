# Mobile app plan

## Navigation shell

Bottom tab bar with four tabs:

1. **Home** — featured complaints, top companies this week, "submit a
   complaint" CTA, "suggest a company" CTA.
2. **Companies** — searchable, category-filterable list of companies.
3. **Complaints** — searchable, filterable list of all complaints.
4. **Me** — language selection, theme, "my drafts", "company portal" link
   (opens web), about, privacy.

A floating action button is reserved for **Submit complaint** (visible on Home,
Companies, Complaints).

## Screens

### Public

| Screen | Notes |
|---|---|
| `HomeScreen` | Hero, primary CTAs, "Recent complaints" carousel, "Top companies" list |
| `CompaniesListScreen` | Search bar, category chips, infinite list |
| `CompanyDetailScreen` | Header card (logo, name, contacts), tabs: About / Complaints |
| `ComplaintsListScreen` | Search, filter bottom sheet, infinite list |
| `ComplaintDetailScreen` | Title, status badge, body, evidence carousel, timeline, company reply card |
| `SubmitComplaintFlow` | Three steps: ① pick company / ② describe / ③ attach + review |
| `SuggestCompanyScreen` | One-page form |
| `ReportComplaintSheet` | Bottom sheet from complaint detail |
| `LanguageScreen` | List of locales |
| `AboutScreen` | Static content |

### Auth (future user accounts, scaffolded)

| Screen | Notes |
|---|---|
| `SignInScreen` | Not enabled by default; the public flow is fully anonymous |

## Design system

- **Tokens** — `AppColors`, `AppSpacing`, `AppRadii`, `AppTypography` in
  `lib/core/theme/`.
- **Components** — `AppButton`, `AppTextField`, `AppCard`, `StatusBadge`,
  `CategoryChip`, `EmptyState`, `LoadingSkeleton`, `TimelineEntry`,
  `AttachmentTile`, `CompanyAvatar`.
- **Light/dark** — both first-class; switch in `MeTab`.

## State management

Riverpod. Each feature exposes:
- `*_repository.dart` — talks to API.
- `*_controller.dart` — `AsyncNotifier` over UI state.
- `*_screen.dart` — pure UI consumer.

## Routing

`go_router` with typed routes. Deep links:
- `https://zalba.app/c/<companySlug>`
- `https://zalba.app/p/<complaintId>`

## Networking

`dio` with:
- a `BaseUrlInterceptor` (`String.fromEnvironment('API_BASE_URL')`)
- an `AuthInterceptor` (currently anonymous public auth only)
- a `LocaleInterceptor` that sets `Accept-Language`
- a `LoggingInterceptor` in debug only
- retry on transient 5xx (max 2 retries, exponential)

## Localization

Standard Flutter `intl` + ARB. Files: `lib/l10n/intl_en.arb`, `intl_mk.arb`,
`intl_sq.arb`. `flutter gen-l10n` produces `AppLocalizations`. Locale is
persisted via `shared_preferences`.

## Accessibility

- Semantic labels on every actionable widget.
- Minimum tap target 48dp.
- Respects system text scale up to 200%.
- Contrast checked against WCAG AA in both themes.
