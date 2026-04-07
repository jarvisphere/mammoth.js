# Bibliography Section Fix - Implementation Summary

## Problem
Bibliography section headings (like "Bibliography", "References", "Works Cited") and their entries were being incorrectly marked as citations with `<span class="docx-citation">` wrappers, making them indistinguishable from inline citations.

### Original Output (INCORRECT):
```html
<h1>
  <span class="docx-citation" data-citation="{...}">Bibliography</span>
</h1>
<p class="docx-bibliography-section">
  <span class="docx-citation" data-citation="{...}">Wu, J. (2024)...</span>
</p>
```

## Solution
Implemented context tracking to distinguish between:
- **Inline citations** - Wrapped with `<span class="docx-citation">`
- **Bibliography section headings** - Marked with `<h1-6 class="docx-bibliography-header">`
- **Bibliography entries** - Contained in `<p class="docx-bibliography-section">` WITHOUT citation spans

### New Output (CORRECT):
```html
<h1 class="docx-bibliography-header">Bibliography</h1>
<p class="docx-bibliography-section">Wu, J. (2024)...</p>
```

## Implementation Details

### 1. Body Reader Changes (`lib/docx/body-reader.js`)

#### Added Bibliography SDT Depth Tracking:
```javascript
var bibliographySdtDepth = 0; // Track nesting depth of bibliography SDTs
```

#### Modified SDT Handler:
- Check if SDT is a bibliography BEFORE reading its content
- Increment `bibliographySdtDepth` when entering bibliography SDT
- Read nested content (headings, paragraphs, etc.)
- Decrement `bibliographySdtDepth` when exiting bibliography SDT
- **Skip citation processing** when `bibliographySdtDepth > 0`

```javascript
"w:sdt": function(element) {
    var isBibliography = citationDetector.isBibliographySdt(element);
    var isCitation = citationDetector.isCitationSdt(element);
    
    if (isBibliography) {
        bibliographySdtDepth++;
    }
    
    var contentResult = readXmlElements(element.firstOrEmpty("w:sdtContent").children);
    
    if (isBibliography) {
        bibliographySdtDepth--;
    }
    
    return contentResult.map(function(content) {
        if (isBibliography) {
            // Mark paragraphs as bibliography sections
            return content.map(transforms._elementsOfType(
                documents.types.paragraph,
                function(paragraph) {
                    paragraph._bibliographySection = true;
                    return paragraph;
                }
            ));
        }
        
        // Only process citations if NOT inside a bibliography section
        if (isCitation && bibliographySdtDepth === 0) {
            // ... mark runs with citation metadata
        }
        
        return content;
    });
}
```

#### Updated Paragraph Handler:
```javascript
function(properties, children) {
    var paragraph = new documents.Paragraph(children, properties);
    // Mark paragraphs within BIBLIOGRAPHY fields or SDTs for easy detection
    if (isInBibliographyField() || bibliographySdtDepth > 0) {
        paragraph._bibliographySection = true;
    }
    return paragraph;
}
```

### 2. HTML Converter Changes (`lib/document-to-html.js`)

#### Modified Paragraph Converter:
```javascript
function convertParagraph(element, messages, options) {
    var path = htmlPathForParagraph(element, messages);
    
    if (element._bibliographySection) {
        var style = findStyle(element);
        var isHeading = style && style.to && style.to.tagName && /^h[1-6]$/i.test(style.to.tagName);
        
        if (isHeading) {
            // Mark bibliography section headings with special class
            path = htmlPaths.element(style.to.tagName, {"class": "docx-bibliography-header"}, {fresh: true});
        } else {
            // Mark bibliography entries
            path = htmlPaths.element("p", {"class": "docx-bibliography-section"}, {fresh: true});
        }
    }
    
    return path.wrap(function() {
        // ... convert children
    });
}
```

### 3. Test Updates (`test/citation-output.tests.js`)

Added new tests to verify:
1. Bibliography section headings are marked with `docx-bibliography-header` class
2. Bibliography section headings contain plain text (NO citation spans)
3. Bibliography entries are NOT wrapped in citation spans
4. Inline citations still work correctly

## Output Format

### Inline Citations (In Document Body):
```html
<p>This is a reference: <span class="docx-citation" data-citation="{...}">(Wu, 2024)</span></p>
```

### Bibliography Section Headings:
```html
<h1 class="docx-bibliography-header">Bibliography</h1>
<h1 class="docx-bibliography-header">References</h1>
<h1 class="docx-bibliography-header">Works Cited</h1>
```

### Bibliography Entries:
```html
<p class="docx-bibliography-section">Wu, J. (2024). Insights on Galaxy Evolution from Interpretable Sparse Feature Networks. <em>arXiv (Cornell University)</em>.</p>
```

## Web App Integration

The web app can now easily:

1. **Identify bibliography section headings**:
   ```javascript
   const bibHeaders = document.querySelectorAll('.docx-bibliography-header');
   ```

2. **Identify bibliography entries**:
   ```javascript
   const bibEntries = document.querySelectorAll('.docx-bibliography-section');
   ```

3. **Filter them out if needed**:
   ```javascript
   html = html.replace(/<h[1-6] class="docx-bibliography-header">.*?<\/h[1-6]>/g, '');
   html = html.replace(/<p class="docx-bibliography-section">.*?<\/p>/g, '');
   ```

4. **Extract inline citations only**:
   ```javascript
   const citations = document.querySelectorAll('.docx-citation');
   // These will only be inline citations, NOT bibliography entries
   ```

## Test Results

All **534 tests passing** ✓

Key verified behaviors:
- ✓ Inline citations preserved with `docx-citation` class
- ✓ Bibliography headers marked with `docx-bibliography-header` class
- ✓ Bibliography entries marked with `docx-bibliography-section` class
- ✓ Bibliography headers contain plain text (no citation spans)
- ✓ Bibliography entries do NOT contain citation spans
- ✓ Checkbox functionality unaffected

## Benefits

1. **Clear Distinction**: Easy to distinguish between inline citations and bibliography sections
2. **Web App Control**: Web app can choose to display, hide, or process bibliography sections independently
3. **Semantic HTML**: Headings remain semantic (`<h1>`, `<h2>`, etc.) with appropriate classes
4. **Maintainable**: No special parsing logic needed in the web app
5. **Extensible**: Same pattern can be used for other special sections (e.g., footnotes, endnotes)
