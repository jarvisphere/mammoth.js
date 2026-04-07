# Citation Support in Mammoth.js (Forked Version)

This forked version of mammoth.js includes support for detecting and preserving citation data from DOCX documents.

## Overview

Citations in Word documents can appear in two main forms:
1. **Structured Document Tags (SDT)** - Citation elements wrapped in `<w:sdt>` tags with bibliography/citation properties
2. **Field Codes** - `CITATION` or `BIBLIOGRAPHY` field codes inserted via Word's reference manager

This library **does not parse or interpret** citation data. Instead, it extracts all available raw data and wraps it in the HTML output for application-level processing.

## Output Format

When a citation is detected, it's wrapped in a `<span>` element with the following structure:

```html
<span class="docx-citation" data-citation="{...}">Citation Text</span>
```

### Data Structure for SDT Citations

```json
{
  "type": "citation",
  "text": "(Author, 2023)",
  "attributes": {
    "alias": "Citation alias from Word",
    "tag": "Tag value",
    "id": "SDT identifier",
    "bibliography": true,
    "citation": true,
    "dataBinding": {
      "xpath": "XPath expression",
      "storeItemId": "Store item ID"
    }
  }
}
```

### Data Structure for Field Code Citations

```json
{
  "type": "citation",
  "fieldCode": "CITATION",
  "rawInstrText": "CITATION AuthorYear2023",
  "arguments": "AuthorYear2023"
}
```

For bibliography fields:
```json
{
  "type": "bibliography",
  "fieldCode": "BIBLIOGRAPHY",
  "rawInstrText": "BIBLIOGRAPHY",
  "arguments": ""
}
```

## Usage

```javascript
const mammoth = require('mammoth');

const result = await mammoth.convertToHtml({ arrayBuffer });

// Extract citations from HTML
const parser = new DOMParser();
const doc = parser.parseFromString(result.value, 'text/html');
const citationSpans = doc.querySelectorAll('.docx-citation');

citationSpans.forEach((span) => {
  const citationData = JSON.parse(span.getAttribute('data-citation'));
  console.log('Citation found:', citationData);
  
  // Process citation data as needed in your application
  // - Parse the text for author/year
  // - Look up citation in your database
  // - Convert to your internal citation format
  // etc.
});
```

## Implementation Details

### Files Modified
- `lib/citation-detector.js` - New module for detecting citations
- `lib/docx/body-reader.js` - Updated to detect citation SDTs and field codes
- `lib/document-to-html.js` - Updated to wrap citations in HTML with metadata

### Detection Logic

1. **SDT Detection**: Checks for `w:bibliography` or `w:citation` elements in SDT properties, or tags containing "citation" or "bibliography"
2. **Field Code Detection**: Looks for `CITATION` or `BIBLIOGRAPHY` field codes in `w:instrText` elements

### Why Generic?

This approach keeps the library generic and maintainable:
- Citation formats vary widely (APA, MLA, Chicago, IEEE, etc.)
- Citation parsing logic can change over time
- Different applications may need different citation structures
- Application-level parsing is more flexible and testable

## Limitations

1. **Complex Citations**: Citations with multiple sources in one field may need additional parsing
2. **Custom Styles**: Non-standard citation styles may not be detected
3. **Bibliography Text**: The full bibliography list formatting is preserved but not structured

## Application-Level Processing

After extracting raw citation data, your application should:

1. **Parse the text** - Extract author, year, and other metadata from the citation text
2. **Match citations** - Look up citations in your database or citation service
3. **Convert format** - Transform to your internal citation structure
4. **Handle errors** - Deal with unrecognized or malformed citations

Example processing:

```typescript
function parseCitation(metadata: CitationMetadata): Citation | null {
  if (!metadata.text) return null;
  
  // Parse parenthetical citation: (Author, Year)
  const match = metadata.text.match(/\(([^,]+),\s*(\d{4})\)/);
  if (match) {
    return {
      author: match[1].trim(),
      year: match[2],
      raw: metadata
    };
  }
  
  // Handle other formats...
  return null;
}
```

## Testing

To test citation extraction, create a DOCX file with citations using Word's reference manager, then:

```javascript
const result = await mammoth.convertToHtml({ 
  path: 'document-with-citations.docx' 
});

console.log('HTML:', result.value);
console.log('Messages:', result.messages);
```

Check the console for any warnings or errors related to citation processing.

