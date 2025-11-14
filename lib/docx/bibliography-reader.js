/**
 * Bibliography reader for DOCX documents
 * Extracts full citation metadata from Word's bibliography store
 */

var xml = require("../xml");
var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;

/**
 * Read bibliography sources from customXml
 * Word stores bibliography in customXml/itemX.xml files (usually item4.xml)
 */
function readBibliography(docxFile) {
    var Promise = require("bluebird");
    
    // Check multiple item files (Word can use item1.xml through item4.xml or more)
    var itemFiles = [];
    for (var i = 1; i <= 10; i++) {
        var path = "customXml/item" + i + ".xml";
        if (docxFile.exists(path)) {
            itemFiles.push(path);
        }
    }
    
    if (itemFiles.length === 0) {
        return Promise.resolve({});
    }
    
    // Try each file to find the one with bibliography data
    return Promise.reduce(itemFiles, function(sources, path) {
        if (Object.keys(sources).length > 0) {
            // Already found bibliography, skip remaining files
            return sources;
        }
        
        return readXmlFromZipFile(docxFile, path)
            .then(function(xmlDoc) {
                if (!xmlDoc) {
                    return sources;
                }
                
                // Check if root element is Sources (bibliography namespace)
                var isBibliography = xmlDoc.name === "b:Sources" || 
                                    xmlDoc.name.indexOf("}Sources") !== -1;
                
                if (isBibliography) {
                    return parseBibliographyXml(xmlDoc);
                }
                return sources;
            })
            .catch(function(error) {
                return sources;
            });
    }, {});
}

/**
 * Parse bibliography XML and extract source entries
 */
function parseBibliographyXml(xmlDoc) {
    var sources = {};
    
    // The root is b:Sources, get its children which are b:Source elements
    var sourceElements = xmlDoc.children || [];
    
    sourceElements.forEach(function(sourceElement) {
        // Check if this is a Source element (handle namespace)
        if (sourceElement.name === "b:Source" || sourceElement.name.indexOf("}Source") !== -1) {
            var source = parseSource(sourceElement);
            if (source.tag) {
                sources[source.tag] = source;
            }
        }
    });
    
    return sources;
}

/**
 * Parse a single bibliography source element
 */
function parseSource(sourceElement) {
    var source = {
        tag: getElementText(sourceElement, "b:Tag"),
        type: getElementText(sourceElement, "b:SourceType"),
        title: getElementText(sourceElement, "b:Title"),
        year: getElementText(sourceElement, "b:Year"),
        publisher: getElementText(sourceElement, "b:Publisher"),
        city: getElementText(sourceElement, "b:City"),
        pages: getElementText(sourceElement, "b:Pages"),
        volume: getElementText(sourceElement, "b:Volume"),
        issue: getElementText(sourceElement, "b:Issue"),
        journalName: getElementText(sourceElement, "b:JournalName"),
        url: getElementText(sourceElement, "b:URL"),
        doi: getElementText(sourceElement, "b:DOI"),
        isbn: getElementText(sourceElement, "b:ISBN"),
        lcid: getElementText(sourceElement, "b:LCID")
    };
    
    // Parse authors (handle nested b:Author structure)
    var authorsElement = sourceElement.firstOrEmpty("b:Author");
    if (authorsElement) {
        // Sometimes there's a nested b:Author element
        var nestedAuthor = authorsElement.firstOrEmpty("b:Author");
        if (nestedAuthor && nestedAuthor.children) {
            source.authors = parseAuthors(nestedAuthor);
        } else {
            source.authors = parseAuthors(authorsElement);
        }
    }
    
    // Parse editors if present (handle nested b:Editor structure)
    var editorsElement = sourceElement.firstOrEmpty("b:Editor");
    if (editorsElement) {
        var nestedEditor = editorsElement.firstOrEmpty("b:Editor");
        if (nestedEditor && nestedEditor.children) {
            source.editors = parseAuthors(nestedEditor);
        } else {
            source.editors = parseAuthors(editorsElement);
        }
    }
    
    // Remove undefined/empty fields
    Object.keys(source).forEach(function(key) {
        if (source[key] === undefined || source[key] === null || source[key] === "") {
            delete source[key];
        }
    });
    
    return source;
}

/**
 * Parse author/editor list
 */
function parseAuthors(authorsElement) {
    var authors = [];
    
    // Authors can be in b:NameList > b:Person
    var nameListElement = authorsElement.firstOrEmpty("b:NameList");
    if (!nameListElement || !nameListElement.children) {
        return undefined;
    }
    
    // Get Person elements from children
    nameListElement.children.forEach(function(child) {
        if (child.name === "b:Person" || child.name.indexOf("}Person") !== -1) {
            var person = {
                last: getElementText(child, "b:Last"),
                first: getElementText(child, "b:First"),
                middle: getElementText(child, "b:Middle")
            };
            
            // Build full name
            var nameParts = [];
            if (person.first) nameParts.push(person.first);
            if (person.middle) nameParts.push(person.middle);
            if (person.last) nameParts.push(person.last);
            
            if (nameParts.length > 0) {
                person.fullName = nameParts.join(" ");
                authors.push(person);
            }
        }
    });
    
    return authors.length > 0 ? authors : undefined;
}

/**
 * Helper to get text content of a child element
 * Handles both namespaced (b:Tag) and non-namespaced tags
 */
function getElementText(parentElement, tagName) {
    var element = parentElement.first(tagName);
    if (!element) {
        // Try without namespace prefix if not found
        var localName = tagName.replace("b:", "");
        element = parentElement.children.find(function(child) {
            return child.name === tagName || 
                   child.name.indexOf("}" + localName) !== -1;
        });
    }
    return element ? element.text() : undefined;
}

module.exports = {
    readBibliography: readBibliography
};

