# Originals

Originals is an additional PsyEngine theme: a calm assessment workspace with warm off-white surfaces, forest green accents, soft corners, and a persistent desktop sidebar. Studio (`minimax`) remains the default; Corporate (`ibm`) remains available.

## Use

Choose **Originals** from the palette menu on the login page or application toolbar, or from **Settings → Appearance → Design theme**. The existing `psy-design-theme` cookie saves the selection for this browser, including server rendering. Light, dark, and system color modes remain independent of the design theme.

## Experience

- Desktop navigation groups the existing permission-filtered routes into Workspace, Insights, and Management. Below 1024px, a keyboard-accessible drawer provides the same destinations.
- The dashboard uses existing API data for statistics, assessment progress, and recent sessions. All / Active / Completed filters apply before selecting the five most recent sessions. Session rows open the existing detail pages.
- Shortcuts respect the user's permissions. Loading skeletons, empty views, a refresh action, and an explicit partial-data error state support everyday use.
- Login shares the existing authentication flow, with a new introductory panel and locally rendered geometric artwork.
- Shared design tokens cover forms, tables, dialogs, public assessment pages, and both color modes. Print views remove the sidebar and toolbar.
- Theme cards show illustrative light-mode previews of all three layouts. Selection applies immediately and is announced with a status message.
- Switching themes preserves the mounted page, including the selected settings tab and unsaved form values. Originals icons use the installed Lucide package and render without an external icon request.

## Implementation

`assets/css/originals.css` contains scoped tokens and shared theme styles. `components/originals/` contains the additional shell, navigation, dashboard, and CSS artwork. `composables/useAppNavigation.js` is shared with the existing layout so route visibility stays consistent across themes. No additional runtime dependencies or database changes are required.
