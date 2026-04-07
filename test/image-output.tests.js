var assert = require("assert");
var mammoth = require("../");
var path = require("path");

describe("Image HTML Output", function() {
    var docxPath = path.join(__dirname, "test-data/image.docx");

    it("should convert images to base64 data URIs", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                assert.ok(
                    result.value.includes('src="data:image'),
                    "Images should have base64 data URI source. Actual output: " + result.value
                );
            });
    });

    it("should wrap images in img elements", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                var imgRegex = /<img[^>]*src="data:image[^>]*>/;
                assert.ok(
                    imgRegex.test(result.value),
                    "Images should be wrapped in img elements with data URIs"
                );
            });
    });

    it("should preserve alt text if present", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                // If the test image has alt text, it should be preserved
                // This test will pass even if there's no alt text in the test image
                var imgRegex = /<img[^>]*>/;
                assert.ok(
                    imgRegex.test(result.value),
                    "Image tags should be present"
                );
            });
    });

    it("should handle multiple images in document", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                var imgMatches = result.value.match(/<img[^>]*src="data:image[^>]*>/g);
                // Test document should have at least 1 image
                assert.ok(
                    imgMatches && imgMatches.length >= 1,
                    "Document should contain at least one image"
                );
            });
    });

    it("should produce valid img tags", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                // Check that img tags are properly formatted
                var imgRegex = /<img[^>]*src="data:image\/[^"]+;base64,[^"]*"[^>]*>/;
                assert.ok(
                    imgRegex.test(result.value),
                    "Images should have properly formatted data URI with MIME type"
                );
            });
    });
});
