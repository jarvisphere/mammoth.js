# Image Support in Mammoth.js

This document describes the image import implementation for DOCX files.

## Overview

Mammoth.js converts embedded images from DOCX files to base64-encoded data URIs, making them portable and ready for use in web applications. The conversion happens in two stages:

1. **Mammoth.js** (this package): Reads images from DOCX → Converts to base64 data URIs
2. **Web Module** (`apps/web`): Converts base64 images → TipTap imageBlock nodes

## Architecture

```
DOCX File (Embedded Images)
    ↓
[mammoth.js/lib/images.js]
    ↓
HTML: <img src="data:image/png;base64,..." alt="..." />
    ↓
[apps/web/lib/utils/docx.ts]
    ↓
TipTap: <img src="data:image/png;base64,..." alt="..." width="..." height="..." />
    ↓
Rendered in TipTap editor with ImageBlock component
```

## Supported Image Features

### ✅ Currently Implemented

- **Embedded Images**: Images stored within the DOCX file
- **Base64 Encoding**: Automatic conversion to data URIs
- **Image Formats**: PNG, JPEG, GIF, BMP, and other common formats
- **Alt Text**: Preserved from DOCX metadata
- **Multiple Images**: Handles documents with multiple images
- **Image Dimensions**: Width and height attributes

### ⚠️ Limitations

- **External Images**: Requires `externalFileAccess` option to be enabled
- **Large Files**: Base64 encoding increases file size (~33% larger)
- **No Compression**: Images are not compressed during conversion

## Files Modified

### Core Implementation
- **`lib/images.js`**: Default `dataUri` converter (no changes needed)
- **`lib/documents.js`**: Existing `Image` document type (no changes needed)
- **`lib/docx/body-reader.js`**: Existing image readers (no changes needed)
- **`lib/document-to-html.js`**: Uses default image converter (no changes needed)

### Tests
- **`test/image-output.tests.js`**: Test suite for image HTML output (NEW)
- **`test/test-data/image.docx`**: Sample DOCX with embedded images (NEW)

### Web Module Integration
- **`apps/web/lib/utils/docx.ts`**: Converter from mammoth HTML to TipTap format

## Usage

### From DOCX
```javascript
const mammoth = require('mammoth');

mammoth.convertToHtml({path: 'document.docx'})
    .then(result => {
        // result.value contains:
        // <img src="data:image/png;base64,iVBORw0KG..." alt="My Image" />
        console.log(result.value);
    });
```

### In Web App
The web module automatically detects and processes images with data URIs:
```html
<!-- Mammoth output -->
<img src="data:image/png;base64,..." alt="Logo" />

<!-- TipTap format (web module adds dimensions) -->
<img src="data:image/png;base64,..." alt="Logo" width="100%" height="auto" />
```

## Testing

Run image tests:
```bash
cd apps/mammoth.js
npm test -- --grep "Image HTML Output"
```

Run all tests:
```bash
npm test
```

## Technical Details

### Image Reading Process

1. **Detection**: Body reader finds `w:drawing` or `v:imagedata` elements
2. **Relationship Lookup**: Uses relationship ID to find image file in DOCX
3. **Content Type**: Determines MIME type from content types manifest
4. **Base64 Encoding**: Reads binary data and encodes to base64
5. **Data URI**: Creates `data:[content-type];base64,[encoded-data]` URI

### Supported Content Types

- `image/png`
- `image/jpeg`
- `image/gif`
- `image/bmp`
- `image/svg+xml`
- `image/webp`

### Default Converter

Mammoth uses the `images.dataUri` converter by default:
```javascript
exports.dataUri = imgElement(function(element) {
    return element.readAsBase64String().then(function(imageBuffer) {
        return {
            src: "data:" + element.contentType + ";base64," + imageBuffer
        };
    });
});
```

The web module detects images by their data URI format (`src="data:image/..."`), so no special class markers are needed.

## Configuration Options

### Custom Image Converter

You can provide a custom image converter:
```javascript
mammoth.convertToHtml({path: 'document.docx'}, {
    convertImage: mammoth.images.imgElement(function(image) {
        return image.read().then(function(imageBuffer) {
            // Save to file or cloud storage
            return saveToDisk(imageBuffer).then(function(url) {
                return { src: url };
            });
        });
    })
});
```

### External File Access

To allow loading external images referenced in the DOCX:
```javascript
mammoth.convertToHtml({path: 'document.docx'}, {
    externalFileAccess: true
});
```

## TipTap Integration

The ImageBlock extension expects these attributes:
- `src`: Image source (data URI or URL)
- `alt`: Alternative text for accessibility
- `width`: Image width (optional, defaults to 100%)
- `height`: Image height (optional, defaults to auto)
- `data-fileid`: For uploaded images (not used in DOCX import)

## Performance Considerations

### Base64 Encoding Impact

- **Pros**: 
  - Self-contained HTML
  - No external image hosting needed
  - Works offline
  - No broken image links

- **Cons**:
  - Increases HTML size by ~33%
  - Not cacheable by browsers
  - Slower initial page load for large images

### Recommendations

For production use:
1. **Small Documents**: Base64 encoding is fine
2. **Large Documents**: Consider custom converter that uploads to cloud storage
3. **Multiple Large Images**: Implement image optimization/compression

## Example: Cloud Storage Integration

```javascript
const mammoth = require('mammoth');
const cloudStorage = require('./your-cloud-storage');

mammoth.convertToHtml({path: 'document.docx'}, {
    convertImage: mammoth.images.imgElement(async function(image) {
        const imageBuffer = await image.readAsBuffer();
        const contentType = image.contentType;
        
        // Upload to cloud storage
        const url = await cloudStorage.upload(imageBuffer, contentType);
        
        return { src: url };
    })
});
```

## Future Enhancements

- [ ] Image compression during conversion
- [ ] Automatic cloud upload option
- [ ] Image dimension extraction from binary data
- [ ] Support for linked (non-embedded) images
- [ ] Image format conversion (e.g., BMP → PNG)
- [ ] Lazy loading support for large documents

## References

- [Office Open XML Image Spec](http://www.ecma-international.org/publications/standards/Ecma-376.htm)
- [Data URI Scheme](https://datatracker.ietf.org/doc/html/rfc2397)
- [TipTap Image Extension](https://tiptap.dev/api/nodes/image)

## Credits

Built on mammoth.js's existing image support infrastructure.
