# Bibliography Section Fix - Final Implementation

## Problem
Bibliography section headings and entries were being incorrectly wrapped in `<span class="docx-citation">` tags, making them indistinguishable from inline citations.

### Example of Incorrect Output:
```html
<h1>
  <span class="docx-citation" data-citation="{...}">Bibliography</span>
</h1>
<p>
  <span class="docx-citation" data-citation="{...}">Wu, J. (2024)...</span>
</p>
```

### Expected Output:
```html
<h1 class="docx-bibliography-header">Bibliography</h1>
<p class="docx-bibliography-section">Wu, J. (2024)...</p>
```

## Root Causes

1. **Bibliography SDT Depth Tracking**: Citation SDTs inside bibliography SDTs were being processed because depth tracking alone wasn't sufficient
2. **Bibliography Field Tracking**: The `isInBibliographyField()` check wasn't being used when processing citation SDTs
3. **HTML Conversion**: Runs with citation metadata were being wrapped in citation spans even when inside bibliography sections

## Solution - Three-Layer Defense

### Layer 1: Body Reader - SDT Processing (`lib/docx/body-reader.js`)

**Added dual checks** before applying citation metadata to runs:

```javascript
// Process citation SDTs ONLY if we're NOT inside a bibliography section
if (isCitation && bibliographySdtDepth === 0 && !isInBibliographyField()) {
    // Apply citation metadata to runs
}
```

This prevents citation metadata from being applied when:
- Inside a bibliography SDT (`bibliographySdtDepth > 0`)
- Inside a bibliography field code (`isInBibliographyField()` returns true)

### Layer 2: HTML Converter - Paragraph Context (`lib/document-to-html.js`)

**Pass bibliography context** to child elements:

```javascript
function convertParagraph(element, messages, options) {
    // ... setup path with docx-bibliography-header or docx-bibliography-section class
    
    return path.wrap(function() {
        // Pass bibliography section context to children
        var extendedOptions = element._bibliographySection
            ? Object.assign({}, options, {_inBibliographySection: true})
            : options;
        var content = convertElements(element.children, messages, extendedOptions);
        // ...
    });
}
```

### Layer 3: HTML Converter - Run Processing (`lib/document-to-html.js`)

**Skip citation wrapping** when inside bibliography sections:

```javascript
function convertRun(run, messages, options) {
    // ...
    
    // Check if this run has citation metadata
    // BUT skip wrapping if we're inside a bibliography section
    if (run._citationMetadata && !options._inBibliographySection) {
        // Wrap in citation span
    }
    // ...
}
```

## Complete Flow

### For Inline Citations:
1. **Body Reader**: Citation SDT detected, NOT inside bibliography → Apply `_citationMetadata` to runs
2. **HTML Converter**: Paragraph is NOT a bibliography section → Don't set `_inBibliographySection`
3. **HTML Converter**: Run has `_citationMetadata` and NOT `_inBibliographySection` → Wrap in `<span class="docx-citation">`

**Result**: `<p>Text <span class="docx-citation">...</span> more text</p>` ✓

### For Bibliography Section Headings:
1. **Body Reader**: Bibliography SDT/field detected → Increment `bibliographySdtDepth` or push to field stack
2. **Body Reader**: Citation SDT inside bibliography → Skip applying metadata (depth > 0 or field present)
3. **HTML Converter**: Paragraph is heading + has `_bibliographySection` → Use `<h1 class="docx-bibliography-header">`
4. **HTML Converter**: Set `_inBibliographySection: true` for children5. **HTML Converter**: Run might have metadata but `_inBibliographySection` is true → Skip wrapping

**Result**: `<h1 class="docx-bibliography-header">Bibliography</h1>` ✓

### For Bibliography Entries:
1. **Body Reader**: Bibliography SDT/field detected → Mark paragraphs with `_bibliographySection`
2. **Body Reader**: Citation SDTs inside bibliography → Skip applying metadata
3. **HTML Converter**: Paragraph has `_bibliographySection` → Use `<p class="docx-bibliography-section">`
4. **HTML Converter**: Set `_inBibliographySection: true` for children
5. **HTML Converter**: Runs don't get wrapped in citation spans

**Result**: `<p class="docx-bibliography-section">Wu, J. (2024)...</p>` ✓

## Key Functions Modified

### `/apps/mammoth.js/lib/docx/body-reader.js`

1. **Added `bibliographySdtDepth` counter** (line ~28)
2. **Modified SDT handler** to:
   - Increment/decrement depth when entering/exiting bibliography SDTs
   - Check BOTH `bibliographySdtDepth === 0` AND `!isInBibliographyField()` before applying citation metadata
3. **Paragraph handler** marks paragraphs with `_bibliographySection` when inside bibliography

### `/apps/mammoth.js/lib/document-to-html.js`

1. **Modified `convertParagraph`** to:
   - Detect heading vs. entry paragraphs
   - Apply appropriate class (`docx-bibliography-header` or `docx-bibliography-section`)
   - Pass `_inBibliographySection: true` to child elements
2. **Modified `convertRun`** to:
   - Check `!options._inBibliographySection` before wrapping runs in citation spans

### `/apps/mammoth.js/test/citation-output.tests.js`

Added tests to verify:
1. Bibliography headers are marked with `docx-bibliography-header` class
2. Bibliography headers contain plain text (no citation spans)
3. Bibliography entries are NOT wrapped in citation spans

## Testing

Run the citation output tests:

```bash
cd /Users/hemant/work/Projects/frontend/reactjs/jenni/apps/mammoth.js
npm test -- --grep "Citation HTML Output"
```

Or run all tests:

```bash
npm test
```

All tests should pass, including:
- ✓ Citation output tests
- ✓ Checkbox tests (unaffected by changes)
- ✓ All existing mammoth tests

## Web App Integration

The web app can now:

### 1. Identify and Filter Bibliography Sections

```javascript
// Remove bibliography sections entirely
html = html.replace(/<h[1-6] class="docx-bibliography-header">.*?<\/h[1-6]>/g, '');
html = html.replace(/<p class="docx-bibliography-section">.*?<\/p>/g, '');
```

### 2. Process Inline Citations Only

```javascript
// Extract citations (will NOT include bibliography entries)
const citations = document.querySelectorAll('.docx-citation');
citations.forEach(citation => {
    const data = JSON.parse(citation.getAttribute('data-citation'));
    // Process inline citation
});
```

### 3. Distinguish Between Elements

```javascript
// Check if element is a bibliography header
const isBibHeader = element.classList.contains('docx-bibliography-header');

// Check if element is a bibliography entry
const isBibEntry = element.classList.contains('docx-bibliography-section');

// Check if element is an inline citation
const isCitation = element.classList.contains('docx-citation');
```

## Verification

To verify the fix is working, check the HTML output:

✓ Inline citations should have: `<span class="docx-citation">`
✓ Bibliography headers should have: `<h1 class="docx-bibliography-header">Bibliography</h1>`
✓ Bibliography entries should have: `<p class="docx-bibliography-section">Wu, J. (2024)...</p>`
✗ Bibliography headers should NOT contain `<span class="docx-citation">`
✗ Bibliography entries should NOT contain `<span class="docx-citation">`

## Benefits

1. **Clear Separation**: Bibliography sections are completely separate from inline citations
2. **Easy Filtering**: Web app can easily identify and remove/process bibliography sections
3. **Semantic HTML**: Headers remain semantic (`<h1>`, etc.) with appropriate classes
4. **No Data Loss**: Bibliography content is preserved, just not wrapped as citations
5. **Future-Proof**: Same pattern can be used for other special sections

## Edge Cases Handled

1. **Nested SDTs**: Bibliography SDTs can contain citation SDTs (for headings/entries)
2. **Field Codes**: Both BIBLIOGRAPHY field codes and bibliography SDTs are supported
3. **Multiple Sections**: Multiple bibliography sections (Bibliography, References, Works Cited) all handled
4. **Mixed Content**: Documents with both inline citations and bibliography sections work correctly

## Performance

No performance impact:
- Depth tracking is a simple counter (O(1))
- Field checking uses existing stack (O(n) where n = field depth, typically < 5)
- HTML conversion adds one object property check per run (negligible)
