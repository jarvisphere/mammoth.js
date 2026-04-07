var assert = require("assert");
var citationDetector = require("../../lib/docx/citation-detector");
var xml = require("../../lib/xml");

describe('Citation Detector', function() {
    describe('isCitationSdt', function() {
        it('should return true for SDT with w:citation property', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:citation")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), true);
        });

        it('should return false for SDT without w:citation property', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for checkbox SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:checkbox")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for w14:checkbox SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w14:checkbox")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for wordml:checkbox SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("wordml:checkbox")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for date picker SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:date", {}, [
                        xml.element("w:dateFormat", {"w:val": "dd-MM-yyyy"})
                    ])
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for dropdown list SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:dropDownList", {}, [
                        xml.element("w:listItem", {"w:value": "X"})
                    ])
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for combobox SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:comboBox", {}, [
                        xml.element("w:listItem", {"w:value": "A"})
                    ])
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for text control SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:text")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for rich text control SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:richText")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for picture control SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:picture")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });

        it('should return false for SDT with no sdtPr', function() {
            var sdtElement = xml.element("w:sdt", {}, []);
            
            assert.strictEqual(citationDetector.isCitationSdt(sdtElement), false);
        });
    });

    describe('isBibliographySdt', function() {
        it('should return true for SDT with w:bibliography property', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:bibliography")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isBibliographySdt(sdtElement), true);
        });

        it('should return true for SDT with Bibliographies docPartGallery', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:docPartObj", {}, [
                        xml.element("w:docPartGallery", {"w:val": "Bibliographies"})
                    ])
                ])
            ]);
            
            assert.strictEqual(citationDetector.isBibliographySdt(sdtElement), true);
        });

        it('should return false for SDT with w:citation (takes precedence)', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:citation"),
                    xml.element("w:bibliography")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isBibliographySdt(sdtElement), false);
        });

        it('should return false for checkbox SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:checkbox")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isBibliographySdt(sdtElement), false);
        });

        it('should return false for date picker SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:date")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isBibliographySdt(sdtElement), false);
        });

        it('should return false for dropdown list SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:dropDownList")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isBibliographySdt(sdtElement), false);
        });

        it('should return false for combobox SDT', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:comboBox")
                ])
            ]);
            
            assert.strictEqual(citationDetector.isBibliographySdt(sdtElement), false);
        });
    });

    describe('parseCitationInstrText', function() {
        it('should parse valid CITATION field', function() {
            var result = citationDetector.parseCitationInstrText(' CITATION Tag123 \\l 1033 ');
            
            assert.strictEqual(result.type, 'citation');
            assert.strictEqual(result.tag, 'Tag123');
            assert.strictEqual(result.arguments, '\\l 1033');
        });

        it('should return null for non-citation field', function() {
            var result = citationDetector.parseCitationInstrText(' HYPERLINK "http://example.com" ');
            
            assert.strictEqual(result, null);
        });

        it('should return null for empty string', function() {
            var result = citationDetector.parseCitationInstrText('');
            
            assert.strictEqual(result, null);
        });

        it('should return null for non-string input', function() {
            var result = citationDetector.parseCitationInstrText(null);
            
            assert.strictEqual(result, null);
        });
    });

    describe('parseBibliographyInstrText', function() {
        it('should parse valid BIBLIOGRAPHY field', function() {
            var result = citationDetector.parseBibliographyInstrText(' BIBLIOGRAPHY ');
            
            assert.strictEqual(result.type, 'bibliography');
        });

        it('should return null for non-bibliography field', function() {
            var result = citationDetector.parseBibliographyInstrText(' CITATION Tag ');
            
            assert.strictEqual(result, null);
        });

        it('should return null for empty string', function() {
            var result = citationDetector.parseBibliographyInstrText('');
            
            assert.strictEqual(result, null);
        });
    });

    describe('extractCitationMetadata', function() {
        it('should extract SDT ID from citation', function() {
            var sdtElement = xml.element("w:sdt", {}, [
                xml.element("w:sdtPr", {}, [
                    xml.element("w:id", {"w:val": "12345"}),
                    xml.element("w:citation")
                ])
            ]);
            
            var metadata = citationDetector.extractCitationMetadata(sdtElement);
            
            assert.strictEqual(metadata.type, 'citation');
            assert.strictEqual(metadata.sdtId, '12345');
        });

        it('should return empty object if no sdtPr', function() {
            var sdtElement = xml.element("w:sdt", {}, []);
            
            var metadata = citationDetector.extractCitationMetadata(sdtElement);
            
            assert.deepStrictEqual(metadata, {});
        });
    });
});
