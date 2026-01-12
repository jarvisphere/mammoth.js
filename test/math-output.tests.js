var assert = require("assert");
var mammoth = require("../");
var path = require("path");

describe("Math HTML Output", function() {
    var docxPath = path.join(__dirname, "test-data/math.docx");

    it("should detect and mark math elements with docx-math class", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                /* eslint-disable no-console */
                console.log("\n=== Math DOCX HTML output ===");
                console.log(result.value);
                console.log("\n=== Messages ===");
                console.log(result.messages);
                console.log("===\n");
                /* eslint-enable no-console */
                
                assert.ok(
                    result.value.includes('class="docx-math"'),
                    "Math should be marked with docx-math class. Actual output: " + result.value
                );
            });
    });

    it("should include math text in data-math-text attribute", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                assert.ok(
                    result.value.includes('data-math-text='),
                    "Math should have data-math-text attribute"
                );
            });
    });

    it("should wrap math in span elements", function() {
        return mammoth.convertToHtml({path: docxPath})
            .then(function(result) {
                var mathSpanRegex = /<span class="docx-math"[^>]*>.*?<\/span>/;
                assert.ok(
                    mathSpanRegex.test(result.value),
                    "Math should be wrapped in span elements"
                );
            });
    });
});
