# Status Dropdown Fix

## Problem
Status dropdowns (and other Word SDT controls) in DOCX files were being incorrectly detected as citations, causing them to be wrapped with `<span class="docx-citation">` tags.

### Example Bug Output (Before Fix)
```html
<span class="docx-citation" data-citation="{...}">Not started</span>
```

### Expected Output (After Fix)
```html
<p>Not started</p>
```

## Root Cause
The citation detection logic was only checking for checkboxes but not excluding other common Word Structured Document Tag (SDT) control types like:
- Dropdown lists (`w:dropDownList`)
- Date pickers (`w:date`)
- Text controls (`w:text`)
- Rich text controls (`w:richText`)
- Combo boxes (`w:comboBox`)
- Picture controls (`w:picture`)

## XML Structure
The Status column in the problematic file has this structure:

```xml
<w:sdt>
  <w:sdtPr>
    <w:alias w:val="Task Status"/>
    <w:id w:val="1848690678"/>
    <w:dropDownList w:lastValue="Not started">
      <w:listItem w:displayText="Not started" w:value="Not started"/>
      <w:listItem w:displayText="In progress" w:value="In progress"/>
      <w:listItem w:displayText="Completed" w:value="Completed"/>
    </w:dropDownList>
  </w:sdtPr>
  <w:sdtContent>
    <w:r>
      <w:t>Not started</w:t>
    </w:r>
  </w:sdtContent>
</w:sdt>
```

Notice the `<w:dropDownList>` element - this should NOT be treated as a citation.

## Solution
Updated `lib/docx/citation-detector.js` to exclude all common SDT control types before checking for citations:

```javascript
function isCitationSdt(sdtElement) {
    var sdtPr = sdtElement.first("w:sdtPr");
    if (!sdtPr) {
        return false;
    }
    
    // Exclude common SDT control types
    if (sdtPr.first("wordml:checkbox") || sdtPr.first("w:checkbox")) return false;
    if (sdtPr.first("w:date")) return false;
    if (sdtPr.first("w:dropDownList")) return false;  // ← Key fix for Status dropdowns
    if (sdtPr.first("w:comboBox")) return false;
    if (sdtPr.first("w:text")) return false;
    if (sdtPr.first("w:richText")) return false;
    if (sdtPr.first("w:picture")) return false;
    
    // ONLY return true if explicitly marked as citation
    return !!sdtPr.first("w:citation");
}
```

## Test Results
✅ All 545 tests passing
✅ Status dropdowns: No citation markup
✅ Real citations: Properly wrapped with citation markup

### Test Output
```bash
$ node test-verification.js

=== Test 1: date.docx (Status dropdown) ===
Contains "Not started": true
Has citation class: false
✅ PASSED: Dropdown is NOT detected as citation

=== Test 2: citation.docx (Real citation) ===
Contains "(Wu, 2024)": true
Has citation class: true
✅ PASSED: Real citation is properly detected

=== Summary ===
date.docx citation count: 0 ✅
citation.docx citation count: 1 ✅

🎉 ALL TESTS PASSED!
```

## Files Modified
- `lib/docx/citation-detector.js` - Added exclusions for dropdown lists and other SDT controls

## Usage Note
If you're seeing cached results with citation markup, restart your Node process or clear the require cache:

```javascript
// Clear Node.js require cache
Object.keys(require.cache).forEach(key => {
    delete require.cache[key];
});
```
