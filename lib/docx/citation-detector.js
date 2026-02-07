exports.isCitationSdt = isCitationSdt;
exports.isBibliographySdt = isBibliographySdt;
exports.extractCitationMetadata = extractCitationMetadata;
exports.parseCitationInstrText = parseCitationInstrText;
exports.parseBibliographyInstrText = parseBibliographyInstrText;

function isCitationSdt(sdtElement) {
    var sdtPr = sdtElement.first("w:sdtPr");
    if (!sdtPr) {
        return false;
    }
    
    // Explicitly check it's not a checkbox or other common SDT control types
    if (sdtPr.first("wordml:checkbox") || sdtPr.first("w:checkbox")) {
        return false;
    }
    
    // Exclude date pickers
    if (sdtPr.first("w:date")) {
        return false;
    }
    
    // Exclude dropdown lists (like Status dropdowns)
    if (sdtPr.first("w:dropDownList")) {
        return false;
    }
    
    // Exclude combo boxes
    if (sdtPr.first("w:comboBox")) {
        return false;
    }
    
    // Exclude text controls
    if (sdtPr.first("w:text")) {
        return false;
    }
    
    // Exclude rich text controls
    if (sdtPr.first("w:richText")) {
        return false;
    }
    
    // Exclude picture controls
    if (sdtPr.first("w:picture")) {
        return false;
    }
    
    // Check for citation property - ONLY return true if explicitly marked as citation
    return !!sdtPr.first("w:citation");
}

function isBibliographySdt(sdtElement) {
    var sdtPr = sdtElement.first("w:sdtPr");
    if (!sdtPr) {
        return false;
    }
    
    // Explicitly check it's not a checkbox or other common SDT control types
    if (sdtPr.first("wordml:checkbox") || sdtPr.first("w:checkbox")) {
        return false;
    }
    
    // Exclude date pickers
    if (sdtPr.first("w:date")) {
        return false;
    }
    
    // Exclude dropdown lists (like Status dropdowns)
    if (sdtPr.first("w:dropDownList")) {
        return false;
    }
    
    // Exclude combo boxes
    if (sdtPr.first("w:comboBox")) {
        return false;
    }
    
    // Exclude text controls
    if (sdtPr.first("w:text")) {
        return false;
    }
    
    // Exclude rich text controls
    if (sdtPr.first("w:richText")) {
        return false;
    }
    
    // Exclude picture controls
    if (sdtPr.first("w:picture")) {
        return false;
    }
    
    // Priority: if it has w:citation, treat as citation, not bibliography
    if (sdtPr.first("w:citation")) {
        return false;
    }
    
    // Check for bibliography property
    if (sdtPr.first("w:bibliography")) {
        return true;
    }
    
    // Also check for docPartObj with Bibliographies gallery
    var docPartObj = sdtPr.first("w:docPartObj");
    if (docPartObj) {
        var docPartGallery = docPartObj.first("w:docPartGallery");
        if (docPartGallery) {
            var galleryVal = docPartGallery.attributes["w:val"];
            return galleryVal === "Bibliographies";
        }
    }
    
    return false;
}

function extractCitationMetadata(sdtElement) {
    var sdtPr = sdtElement.first("w:sdtPr");
    if (!sdtPr) {
        return {};
    }
    
    var metadata = {
        type: "citation"
    };
    
    // Get SDT ID
    var idElement = sdtPr.firstOrEmpty("w:id");
    if (idElement.type !== "empty") {
        metadata.sdtId = idElement.attributes["w:val"];
    }
    
    return metadata;
}

function parseCitationInstrText(instrText) {
    if (typeof instrText !== "string") {
        return null;
    }
    
    var trimmed = instrText.trim();
    
    // Check if it starts with CITATION
    if (!trimmed.match(/^CITATION\s+/i)) {
        return null;
    }
    
    // Parse: CITATION Tag \l 1033
    // Extract the citation tag (first argument after CITATION)
    var match = trimmed.match(/^CITATION\s+(\S+)(.*)$/i);
    if (!match) {
        return null;
    }
    
    return {
        type: "citation",
        tag: match[1],        // e.g., "WuJ24"
        arguments: match[2].trim(), // e.g., "\l 1033"
        rawInstrText: instrText
    };
}

function parseBibliographyInstrText(instrText) {
    if (typeof instrText !== "string") {
        return null;
    }
    
    var trimmed = instrText.trim();
    
    // Check if it's a BIBLIOGRAPHY field
    if (!trimmed.match(/^BIBLIOGRAPHY/i)) {
        return null;
    }
    
    return {
        type: "bibliography",
        rawInstrText: instrText
    };
}
