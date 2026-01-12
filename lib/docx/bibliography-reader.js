/* global Promise */
var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;

exports.readBibliography = readBibliography;

function readBibliography(docxFile) {
    // Check customXml files (item1.xml through item10.xml) for bibliography data
    var promises = [];
    for (var i = 1; i <= 10; i++) {
        var path = "customXml/item" + i + ".xml";
        if (docxFile.exists(path)) {
            promises.push(readBibliographyFile(docxFile, path));
        }
    }

    return Promise.all(promises).then(function(results) {
        // Find the first non-empty result
        for (var i = 0; i < results.length; i++) {
            if (Object.keys(results[i]).length > 0) {
                return results[i];
            }
        }
        return {};
    });
}

function readBibliographyFile(docxFile, path) {
    return readXmlFromZipFile(docxFile, path)
        .then(function(xmlDoc) {
            if (!xmlDoc) {
                return {};
            }
            
            // Check if this is a bibliography sources file
            var rootName = xmlDoc.name || "";
            var isBibliography = rootName === "b:Sources" ||
                                rootName.indexOf("}Sources") !== -1 ||
                                rootName.indexOf(":Sources") !== -1;

            if (!isBibliography) {
                return {};
            }

            return parseBibliographyXml(xmlDoc);
        })
        .catch(function() {
            return {};
        });
}

function parseBibliographyXml(xmlDoc) {
    var sources = {};
    var sourceElements = xmlDoc.children || [];
    
    sourceElements.forEach(function(sourceElement) {
        var elementName = sourceElement.name || "";
        var isSource = elementName === "b:Source" ||
                      elementName.indexOf("}Source") !== -1 ||
                      elementName.indexOf(":Source") !== -1;

        if (isSource) {
            var source = parseSource(sourceElement);
            if (source.tag) {
                sources[source.tag] = source;
            }
        }
    });
    
    return sources;
}

function parseSource(sourceElement) {
    var source = {
        tag: getElementText(sourceElement, "Tag"),
        sourceType: getElementText(sourceElement, "SourceType"),
        guid: getElementText(sourceElement, "Guid"),
        title: getElementText(sourceElement, "Title"),
        year: getElementText(sourceElement, "Year"),
        journalName: getElementText(sourceElement, "JournalName"),
        bookTitle: getElementText(sourceElement, "BookTitle"),
        publisher: getElementText(sourceElement, "Publisher"),
        city: getElementText(sourceElement, "City"),
        pages: getElementText(sourceElement, "Pages"),
        volume: getElementText(sourceElement, "Volume"),
        issue: getElementText(sourceElement, "Issue"),
        doi: getElementText(sourceElement, "DOI"),
        url: getElementText(sourceElement, "URL"),
        refOrder: getElementText(sourceElement, "RefOrder")
    };
    
    // Parse authors
    var authors = parseAuthors(sourceElement);
    if (authors.length > 0) {
        source.authors = authors;
    }
    
    // Remove undefined/null values
    Object.keys(source).forEach(function(key) {
        if (source[key] === undefined || source[key] === null || source[key] === "") {
            delete source[key];
        }
    });
    
    return source;
}

function parseAuthors(sourceElement) {
    var authors = [];
    var children = sourceElement.children || [];
    
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var childName = child.name || "";
        
        if (childName.indexOf("Author") !== -1) {
            // Navigate nested Author > Author > NameList > Person structure
            var authorElement = child;
            var nameListAuthors = findDeep(authorElement, "NameList");
            
            if (nameListAuthors) {
                var persons = nameListAuthors.children || [];
                persons.forEach(function(person) {
                    var personName = person.name || "";
                    if (personName.indexOf("Person") !== -1) {
                        var author = {
                            last: getElementText(person, "Last"),
                            first: getElementText(person, "First"),
                            middle: getElementText(person, "Middle")
                        };
                        
                        // Remove empty fields
                        Object.keys(author).forEach(function(key) {
                            if (!author[key]) {
                                delete author[key];
                            }
                        });
                        
                        if (author.last || author.first) {
                            authors.push(author);
                        }
                    }
                });
            }
        }
    }
    
    return authors;
}

function findDeep(element, targetName) {
    var children = element.children || [];
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var childName = child.name || "";
        
        if (childName.indexOf(targetName) !== -1) {
            return child;
        }
        
        // Recursively search deeper
        var found = findDeep(child, targetName);
        if (found) {
            return found;
        }
    }
    return null;
}

function getElementText(parentElement, tagName) {
    var children = parentElement.children || [];
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var childName = child.name || "";
        
        if (childName.indexOf(tagName) !== -1) {
            var textChildren = child.children || [];
            if (textChildren.length > 0 && textChildren[0].type === "text") {
                return textChildren[0].value;
            }
        }
    }
    return undefined;
}
