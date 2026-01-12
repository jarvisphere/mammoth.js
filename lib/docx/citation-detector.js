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
    
    // Explicitly check it's not a checkbox or other common types
    if (sdtPr.first("wordml:checkbox") || sdtPr.first("w:checkbox")) {
        return false;
    }
    
    // Check for citation property
    var citation = sdtPr.firstOrEmpty("w:citation");
    return citation.type !== "empty";
}

function isBibliographySdt(sdtElement) {
    var sdtPr = sdtElement.first("w:sdtPr");
    if (!sdtPr) {
        return false;
    }
    
    // Explicitly check it's not a checkbox or other common types
    if (sdtPr.first("wordml:checkbox") || sdtPr.first("w:checkbox")) {
        return false;
    }
    
    // Priority: if it has w:citation, treat as citation, not bibliography
    if (sdtPr.firstOrEmpty("w:citation").type !== "empty") {
        return false;
    }
    
    // Check for bibliography property
    var bibliography = sdtPr.firstOrEmpty("w:bibliography");
    if (bibliography.type !== "empty") {
        return true;
    }
    
    // Also check for docPartObj with Bibliographies gallery
    var docPartObj = sdtPr.firstOrEmpty("w:docPartObj");
    if (docPartObj.type !== "empty") {
        var docPartGallery = docPartObj.firstOrEmpty("w:docPartGallery");
        if (docPartGallery.type !== "empty") {
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
