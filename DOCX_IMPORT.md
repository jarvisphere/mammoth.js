# DOCX Import Features

Complete guide to importing DOCX documents with citations, math equations, and images into the Jenni editor.

## Overview

Mammoth.js has been enhanced to support importing rich content from Microsoft Word (DOCX) files, including:

1. **Citations** - Academic citations with metadata
2. **Math Equations** - Mathematical notation via OMML → LaTeX conversion
3. **Images** - Embedded images as base64 data URIs

## Quick Start

```javascript
const mammoth = require('mammoth');

mammoth.convertToHtml({path: 'document.docx'})
    .then(result => {
        // HTML ready for TipTap editor
        console.log(result.value);
    });
```

## Supported Features

### 📚 Citations

**Status**: ✅ Fully Implemented

**Features**:
- Inline citations: (Author, Year)
- Citation metadata extraction
- Bibliography sections auto-detected and filtered
- Multiple citation formats supported

**See**: [Citation Support Documentation](./CITATION_SUPPORT.md)

### 🔢 Math Equations

**Status**: ✅ Fully Implemented (Phase 1)

**Features**:
- Superscripts & subscripts: x²
- Fractions: ½
- Radicals: √x
- Greek letters: α, β, π
- Special symbols: ∞, ≠, ∫
- Functions: sin(x), cos(x)
- Delimiters: (x), [x]

**See**: [Math Support Documentation](./MATH_SUPPORT.md)

### 🖼️ Images

**Status**: ✅ Fully Implemented

**Features**:
- Embedded images from DOCX
- Base64 data URI conversion
- Alt text preservation
- Multiple image formats (PNG, JPEG, GIF, BMP)
- Multiple images per document

**See**: [Image Support Documentation](./IMAGE_SUPPORT.md)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  DOCX File                          │
│  - Text & formatting                                │
│  - Citations (SDTs + Field Codes)                   │
│  - Math (OMML)                                      │
│  - Images (Binary data)                             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Mammoth.js Parser                      │
│  - body-reader.js                                   │
│  - citation-detector.js                             │
│  - math-reader.js                                   │
│  - images.js                                        │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            Mammoth HTML Output                      │
│  <span class="docx-citation">...</span>             │
│  <span class="docx-math">...</span>                 │
│  <img src="data:image/..." />                       │
│  <p class="docx-bibliography-section">...</p>       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         Web Module Converters                       │
│         (apps/web/lib/utils/docx.ts)                │
│  - Citation → <citationPreview>                     │
│  - Math → <span data-type="inline-math">            │
│  - Image → <img> (TipTap format)                    │
│  - Bibliography sections → Filtered out             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            TipTap Editor                            │
│  - PreviewCitationNode                              │
│  - InlineMath / BlockMath (KaTeX)                   │
│  - ImageBlock                                       │
└─────────────────────────────────────────────────────┘
```

## Testing

### Run All Import Tests
```bash
cd apps/mammoth.js
npm test
```

### Run Specific Feature Tests
```bash
# Citations
npm test -- --grep "Citation HTML Output"

# Math
npm test -- --grep "Math HTML Output"

# Images
npm test -- --grep "Image HTML Output"
```

## Integration Guide

### 1. Install Dependencies

```bash
cd apps/mammoth.js
npm install
```

### 2. Use in Web App

```typescript
import { convertDocxToHtml } from '@/lib/utils/docx'

// Convert DOCX to TipTap-compatible HTML
const html = await convertDocxToHtml(docxFile)

// Set content in editor
editor.commands.setContent(html)
```

### 3. Handle Different Content Types

```typescript
// The converter automatically handles:
// - Citations → citationPreview nodes
// - Math → inline-math nodes
// - Images → imageBlock nodes
// - Bibliography sections → removed
```

## File Structure

```
apps/mammoth.js/
├── lib/
│   ├── docx/
│   │   ├── body-reader.js         # Main document parser
│   │   ├── citation-detector.js   # Citation detection
│   │   ├── math-reader.js         # OMML to LaTeX
│   │   └── office-xml-reader.js   # XML namespace config
│   ├── document-to-html.js        # HTML generation
│   ├── documents.js               # Document types
│   └── images.js                  # Image conversion
├── test/
│   ├── citation-output.tests.js   # Citation tests
│   ├── math-output.tests.js       # Math tests
│   ├── image-output.tests.js      # Image tests
│   └── test-data/
│       ├── citation.docx
│       ├── math.docx
│       └── image.docx
├── CITATION_SUPPORT.md            # Citation docs
├── MATH_SUPPORT.md                # Math docs
├── IMAGE_SUPPORT.md               # Image docs
└── DOCX_IMPORT.md                 # This file

apps/web/
└── lib/
    └── utils/
        └── docx.ts                 # Web module converters
```

## Examples

### Complete Document Import

```javascript
const mammoth = require('mammoth')

// Import document with all features
mammoth.convertToHtml({path: 'research-paper.docx'})
    .then(result => {
        console.log('HTML:', result.value)
        console.log('Warnings:', result.messages)
        
        // Use in web app
        editor.commands.setContent(result.value)
    })
```

### Custom Processing

```javascript
// Transform the document before HTML generation
mammoth.convertToHtml({path: 'document.docx'}, {
    transformDocument: (doc) => {
        // Custom document transformations
        return doc
    }
})
```

## Troubleshooting

### Citations Not Appearing
- Check if citations use Structured Document Tags (SDTs)
- Verify bibliography data is present in `word/bibliography.xml`
- Check console for parsing errors

### Math Not Rendering
- Ensure OMML namespace is registered
- Check if math uses `m:oMath` elements
- Verify KaTeX is loaded in the web app

### Images Not Showing
- Check if images are embedded (not linked externally)
- Verify base64 encoding is working
- Check browser console for image load errors

## Performance Tips

1. **Large Documents**: Consider pagination or lazy loading
2. **Many Images**: Use custom converter to upload to cloud storage
3. **Complex Math**: Pre-render with server-side KaTeX
4. **Citations**: Cache bibliography data for faster parsing

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE 11+ with polyfills
- Mobile browsers supported

## Known Limitations

1. **Citations**: Only supports Structured Document Tags (SDTs)
2. **Math**: Phase 1 implementation, matrices/arrays coming soon
3. **Images**: Base64 encoding increases file size by ~33%
4. **Formatting**: Some complex Word formatting may not convert perfectly

## Future Roadmap

### Phase 2: Math Enhancements
- [ ] Matrix support
- [ ] Multi-line equations
- [ ] Block math (display mode)
- [ ] More complex operators

### Phase 3: Advanced Features
- [ ] Table of contents
- [ ] Footnotes/endnotes
- [ ] Comments and tracked changes
- [ ] Custom styles preservation
- [ ] Drawing objects (shapes, diagrams)

### Phase 4: Optimization
- [ ] Streaming for large documents
- [ ] Worker thread processing
- [ ] Image optimization
- [ ] Incremental parsing

## Contributing

To add support for new DOCX features:

1. **Add detection logic** in `body-reader.js`
2. **Create converter** (e.g., `new-feature-reader.js`)
3. **Add HTML output** in `document-to-html.js`
4. **Create web converter** in `apps/web/lib/utils/docx.ts`
5. **Add tests** in `test/new-feature-output.tests.js`
6. **Document** in `NEW_FEATURE_SUPPORT.md`

## License

Same as mammoth.js base library.

## Credits

- **Mammoth.js**: Original DOCX parsing library
- **OMML Conversion**: Based on dwml Python implementation
- **TipTap**: Rich text editor framework

## Support

For issues or questions:
1. Check individual feature documentation
2. Review test files for examples
3. Open an issue with sample DOCX file
