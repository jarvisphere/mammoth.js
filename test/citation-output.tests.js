var assert = require("assert");
var mammoth = require("../");
var path = require("path");

describe("Citation HTML Output", function() {
    var docxPath = path.join(__dirname, "test-data/citation.docx");
    
    it("should output citations with docx-citation class", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                assert.ok(
                    result.value.includes('class="docx-citation"'),
                    "Citation should have docx-citation class"
                );
            });
    });

    it("should include citation data in data-citation attribute", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                assert.ok(
                    result.value.includes('data-citation='),
                    "Citation should have data-citation attribute"
                );

                // Extract and validate citation data structure
                var match = result.value.match(/data-citation="([^"]*)"/);
                assert.ok(match, "Should find data-citation attribute");

                var citationData = JSON.parse(match[1]);
                assert.strictEqual(citationData.type, "citation", "Should have type:citation");
                assert.ok(citationData.tag, "Should have tag field");
                assert.ok(citationData.bibliographyData, "Should have bibliographyData");

                // Validate bibliography data structure
                var bibData = citationData.bibliographyData;
                assert.ok(bibData.title, "Should have title in bibliographyData");
                assert.ok(bibData.authors, "Should have authors in bibliographyData");
                assert.ok(bibData.year, "Should have year in bibliographyData");
            });
    });

    it("should include citation text content", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                assert.ok(
                    result.value.includes("(Wu, 2024)"),
                    "Should preserve citation text (Wu, 2024)"
                );
            });
    });

    it("should mark bibliography sections with docx-bibliography-section class", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                assert.ok(
                    result.value.includes('class="docx-bibliography-section"'),
                    "Bibliography sections should be marked with docx-bibliography-section class"
                );
            });
    });

    it("should not filter out bibliography sections in mammoth output", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                // Mammoth should output them with markers, web app will filter
                var hasBibliographyText =
                    result.value.includes("Bibliography") ||
                    result.value.includes("References") ||
                    result.value.includes("Works Cited");

                assert.ok(
                    hasBibliographyText,
                    "Bibliography section text should be present in mammoth output"
                );
            });
    });

    it("should preserve multiple citations in document", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                // Count citation occurrences
                var citationMatches = result.value.match(/class="docx-citation"/g);
                assert.ok(
                    citationMatches && citationMatches.length > 1,
                    "Should preserve multiple citations (found " + (citationMatches ? citationMatches.length : 0) + ")"
                );
            });
    });

    it("should wrap citation text in span elements", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                var citationSpanRegex = /<span class="docx-citation"[^>]*>.*?<\/span>/;
                assert.ok(
                    citationSpanRegex.test(result.value),
                    "Citations should be wrapped in span elements"
                );
            });
    });
});
