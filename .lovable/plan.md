# Search and link polish

## Changes
- Re-center the search field’s icon, text, and action button across desktop and mobile widths.
- Add subtle focus and typing transitions without changing the page’s visual direction.
- Open submitted searches and external article/news links in a new-tab context, using the Electron bridge when available and `_blank` in browsers.
- Center the article filter controls and preserve their existing behavior.

## Validation
- Check the page at desktop and mobile widths.
- Confirm searches and article links request a new tab and the page has no runtime errors.

## Technical details
- Keep browser and Electron behavior behind one typed link-opening helper.
- Preserve native link targets so Electron can handle new-window events cleanly.
