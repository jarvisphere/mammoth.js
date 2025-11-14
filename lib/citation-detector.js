/**
 * Citation detector for DOCX documents
 * Generic extraction of citation data without parsing - returns raw data for application-level processing
 */

/**
 * Check if an SDT (Structured Document Tag) contains bibliography/citation data
 */
function isCitationSdt(sdtElement) {
    if (!sdtElement) return false;
    
    const sdtPr = sdtElement.firstOrEmpty("w:sdtPr");
    
    // Check for bibliography tag
    const bibliography = sdtPr.first("w:bibliography");
    if (bibliography) {
        return true;
    }
    
    // Check for citation tag
    const citation = sdtPr.first("w:citation");
    if (citation) {
        return true;
    }
    
    // Check for tag with citation-related name
    const tag = sdtPr.firstOrEmpty("w:tag");
    const tagValue = tag.attributes["w:val"];
    if (tagValue && (tagValue.includes("citation") || tagValue.includes("bibliography"))) {
        return true;
    }
    
    return false;
}

/**
 * Extract raw citation metadata from SDT properties
 * Returns all available attributes without interpretation
 */
function extractCitationMetadata(sdtElement) {
    if (!sdtElement) return null;
    
    const sdtPr = sdtElement.firstOrEmpty("w:sdtPr");
    const sdtContent = sdtElement.firstOrEmpty("w:sdtContent");
    
    const metadata = {
        type: 'citation',
        text: '',
        attributes: {}
    };
    
    // Extract text content
    const textElements = [];
    function collectText(element) {
        element.children.forEach((child) => {
            if (child.name === "w:t") {
                textElements.push(child.text());
            } else if (child.children) {
                collectText(child);
            }
        });
    }
    collectText(sdtContent);
    metadata.text = textElements.join('');
    
    // Extract all SDT properties as raw data
    const alias = sdtPr.firstOrEmpty("w:alias");
    if (alias.attributes["w:val"]) {
        metadata.attributes.alias = alias.attributes["w:val"];
    }
    
    const tag = sdtPr.firstOrEmpty("w:tag");
    if (tag.attributes["w:val"]) {
        metadata.attributes.tag = tag.attributes["w:val"];
    }
    
    const id = sdtPr.firstOrEmpty("w:id");
    if (id.attributes["w:val"]) {
        metadata.attributes.id = id.attributes["w:val"];
    }
    
    // Check for bibliography-specific properties
    const bibliography = sdtPr.first("w:bibliography");
    if (bibliography) {
        metadata.attributes.bibliography = true;
    }
    
    // Check for citation-specific properties
    const citation = sdtPr.first("w:citation");
    if (citation) {
        metadata.attributes.citation = true;
    }
    
    // Extract any data binding information
    const dataBinding = sdtPr.first("w:dataBinding");
    if (dataBinding) {
        metadata.attributes.dataBinding = {
            xpath: dataBinding.attributes["w:xpath"],
            storeItemId: dataBinding.attributes["w:storeItemID"]
        };
    }
    
    return metadata;
}

/**
 * Parse instrText for bibliography/citation field codes
 * Returns raw field code data without interpretation
 */
function parseCitationInstrText(instrText) {
    // BIBLIOGRAPHY field
    const bibliographyMatch = /\s*BIBLIOGRAPHY(.*)/.exec(instrText);
    if (bibliographyMatch) {
        return {
            type: 'bibliography',
            fieldCode: 'BIBLIOGRAPHY',
            rawInstrText: instrText.trim(),
            arguments: bibliographyMatch[1].trim()
        };
    }
    
    // CITATION field with optional switches
    const citationMatch = /\s*CITATION\s*(.*)/.exec(instrText);
    if (citationMatch) {
        return {
            type: 'citation',
            fieldCode: 'CITATION',
            rawInstrText: instrText.trim(),
            arguments: citationMatch[1].trim()
        };
    }
    
    return null;
}

module.exports = {
    isCitationSdt,
    extractCitationMetadata,
    parseCitationInstrText
};

