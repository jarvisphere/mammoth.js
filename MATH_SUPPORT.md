# Math Support in Mammoth.js

This document describes the OMML (Office Math Markup Language) to LaTeX conversion implementation.

## Overview

Mammoth.js now supports converting mathematical equations from DOCX files to LaTeX format. The conversion happens in two stages:

1. **Mammoth.js** (this package): Converts OMML → LaTeX
2. **Web Module** (`apps/web`): Converts LaTeX → TipTap inline-math nodes

## Architecture

```
DOCX File (OMML)
    ↓
[mammoth.js/lib/docx/math-reader.js]
    ↓
HTML: <span class="docx-math" data-math-text="x^{2}">x²</span>
    ↓
[apps/web/lib/utils/docx.ts]
    ↓
TipTap: <span data-type="inline-math" data-latex="x^{2}">$x^{2}$</span>
    ↓
KaTeX renders on screen
```

## Supported Math Features

### ✅ Currently Implemented (Phase 1)

- **Superscripts** (`m:sSup`): x² → `x^{2}`
- **Subscripts** (`m:sSub`): x₁ → `x_{1}`
- **Sub & Superscripts** (`m:sSubSup`): x₁² → `x_{1}^{2}`
- **Fractions** (`m:f`): 
  - Standard: ½ → `\frac{1}{2}`
  - Linear: 1/2 → `1/2`
  - Binomial: → `\binom{n}{k}`
- **Radicals** (`m:rad`):
  - Square root: √x → `\sqrt{x}`
  - nth root: ∛x → `\sqrt[3]{x}`
- **Delimiters** (`m:d`): (x) → `\left(x\right)`
- **N-ary Operators** (`m:nary`): ∑, ∫, ∏ with limits
- **Functions** (`m:func`): sin(x) → `\sin(x)`
- **Accents** (`m:acc`): x̂ → `\hat{x}`, x̃ → `\tilde{x}`
- **Bars** (`m:bar`): x̄ → `\overline{x}`, x̱ → `\underline{x}`
- **Greek Letters**: α, β, γ, θ, π, σ, ω, Σ, Ω, etc.
- **Special Symbols**: →, ≠, ≤, ≥, ∞, ∂, ∇, ±, etc.

### 🔮 Future Enhancements (Phase 2+)

- **Matrices** (`m:m`): Matrix notation
- **Arrays** (`m:eqArr`): Multi-line equations
- **Limit Functions** (`m:limLow`, `m:limUpp`): lim, max, min
- **More Accents**: Additional diacritical marks
- **Complex Delimiters**: ⌊x⌋, ⌈x⌉, etc.
- **Block Math**: Display-mode equations

## Files Modified

### Core Implementation
- **`lib/docx/office-xml-reader.js`**: Added math namespace (`m:` → OMML URI)
- **`lib/docx/math-reader.js`**: OMML to LaTeX converter (NEW)
- **`lib/docx/body-reader.js`**: Added handlers for `m:oMath` and `m:oMathPara`
- **`lib/document-to-html.js`**: Converts math nodes to HTML with `docx-math` class
- **`lib/documents.js`**: Added `math` document type

### Tests
- **`test/math-output.tests.js`**: Test suite for math HTML output (NEW)
- **`test/test-data/math.docx`**: Sample DOCX with math equations (NEW)

### Web Module Integration
- **`apps/web/lib/utils/docx.ts`**: Converter from mammoth HTML to TipTap format

## Usage

### From DOCX
```javascript
const mammoth = require('mammoth');

mammoth.convertToHtml({path: 'document.docx'})
    .then(result => {
        // result.value contains:
        // <span class="docx-math" data-math-text="x^{2}">x²</span>
        console.log(result.value);
    });
```

### In Web App
The web module automatically converts the mammoth HTML to TipTap format:
```html
<!-- Mammoth output -->
<span class="docx-math" data-math-text="\frac{1}{2}">½</span>

<!-- TipTap conversion -->
<span data-type="inline-math" data-latex="\frac{1}{2}">$\frac{1}{2}$</span>
```

## Testing

Run math tests:
```bash
cd apps/mammoth.js
npm test -- --grep "Math HTML Output"
```

Run all tests:
```bash
npm test
```

## Technical Details

### OMML Structure
Office Math Markup Language uses XML like:
```xml
<m:oMath>
  <m:sSup>
    <m:e><m:r><m:t>x</m:t></m:r></m:e>
    <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
  </m:sSup>
</m:oMath>
```

### LaTeX Output
Our converter produces clean LaTeX:
```latex
x^{2}
```

### Character Mapping
Unicode math characters are mapped to LaTeX commands:
- `π` → `\pi`
- `α` → `\alpha`
- `≠` → `\ne`
- `∞` → `\infty`

## Extensibility

To add support for new OMML elements:

1. **Add handler in `math-reader.js`**:
```javascript
case 'm:newElement':
    return convertNewElement(element);
```

2. **Implement conversion function**:
```javascript
function convertNewElement(element) {
    var base = getChild(element, 'm:e');
    return '\\newcommand{' + convertElement(base) + '}';
}
```

3. **Add test case in `math-output.tests.js`**

## References

- [OMML Specification](http://schemas.openxmlformats.org/officeDocument/2006/math)
- [LaTeX Math Symbols](https://www.ctan.org/pkg/unicode-math)
- [KaTeX Supported Functions](https://katex.org/docs/supported.html)

## Credits

Based on conversion logic from:
- [dwml](https://github.com/xiilei/dwml) (Python implementation)
- Office Open XML specification
