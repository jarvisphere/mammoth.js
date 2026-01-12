/**
 * Math Reader for Office Math Markup Language (OMML)
 *
 * DOCX files use OMML format for equations. This module detects and extracts
 * math content for later conversion to LaTeX/TipTap format.
 */

/**
 * Check if an element is an Office Math element
 */
function isMathElement(element) {
    return element.name === "m:oMath";
}

/**
 * Extract text content from math element (simplified approach)
 * For now, we extract the raw text. In the future, this could convert OMML to LaTeX.
 *
 * @param {object} element - The m:oMath XML element
 * @returns {string} The extracted math text
 */
function extractMathText(element) {
    var text = [];
    
    function traverse(node) {
        if (!node) {
            return;
        }
        
        // If this is a text node (m:t)
        if (node.name === "m:t" && node.children && node.children.length > 0) {
            node.children.forEach(function(child) {
                if (child.type === "text") {
                    text.push(child.value);
                }
            });
        }
        
        // Recurse through children
        if (node.children) {
            node.children.forEach(traverse);
        }
    }
    
    traverse(element);
    return text.join("");
}

exports.isMathElement = isMathElement;
exports.extractMathText = extractMathText;
