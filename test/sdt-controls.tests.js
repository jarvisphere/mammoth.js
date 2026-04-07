var assert = require("assert");
var path = require("path");
var mammoth = require("../lib");

describe('SDT Control Types', function() {
    describe('Checkbox', function() {
        it('should render checked checkbox as checked input', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/checkbox.docx")
            }).then(function(result) {
                assert.ok(result.value.includes('<input type="checkbox" checked="checked" />'));
                assert.ok(result.value.includes('Checkbox Enabled'));
            });
        });

        it('should render unchecked checkbox as unchecked input', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/checkbox.docx")
            }).then(function(result) {
                assert.ok(result.value.includes('<input type="checkbox" />'));
                assert.ok(result.value.includes('Checkbox Disabled'));
            });
        });

        it('should not be detected as citation', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/checkbox.docx")
            }).then(function(result) {
                // Should not have citation classes
                assert.ok(!result.value.includes('docx-citation'));
                assert.ok(!result.value.includes('data-citation'));
            });
        });
    });

    describe('Combobox', function() {
        it('should render selected combobox value as plain text', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/combobox.docx")
            }).then(function(result) {
                assert.ok(result.value.includes('A'));
                // Should be simple paragraph, not a form element
                assert.equal(result.value, '<p>A</p>');
            });
        });

        it('should not be detected as citation', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/combobox.docx")
            }).then(function(result) {
                assert.ok(!result.value.includes('docx-citation'));
                assert.ok(!result.value.includes('data-citation'));
            });
        });

        it('should not generate warnings', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/combobox.docx")
            }).then(function(result) {
                // Filter out unrelated warnings
                var relevantWarnings = result.messages.filter(function(msg) {
                    return msg.message.toLowerCase().includes('combobox') ||
                           msg.message.toLowerCase().includes('citation');
                });
                assert.equal(relevantWarnings.length, 0);
            });
        });
    });

    describe('Date Picker', function() {
        it('should render selected date as plain text', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/date-picker.docx")
            }).then(function(result) {
                assert.ok(result.value.includes('18-02-2026'));
                assert.equal(result.value, '<p>18-02-2026</p>');
            });
        });

        it('should not be detected as citation', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/date-picker.docx")
            }).then(function(result) {
                assert.ok(!result.value.includes('docx-citation'));
                assert.ok(!result.value.includes('data-citation'));
            });
        });

        it('should not generate warnings', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/date-picker.docx")
            }).then(function(result) {
                var relevantWarnings = result.messages.filter(function(msg) {
                    return msg.message.toLowerCase().includes('date') ||
                           msg.message.toLowerCase().includes('citation');
                });
                assert.equal(relevantWarnings.length, 0);
            });
        });
    });

    describe('Dropdown List', function() {
        it('should render selected dropdown value as plain text', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/dropdown.docx")
            }).then(function(result) {
                assert.ok(result.value.includes('X'));
                assert.equal(result.value, '<p>X</p>');
            });
        });

        it('should not be detected as citation', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/dropdown.docx")
            }).then(function(result) {
                assert.ok(!result.value.includes('docx-citation'));
                assert.ok(!result.value.includes('data-citation'));
            });
        });

        it('should not generate warnings', function() {
            return mammoth.convertToHtml({
                path: path.join(__dirname, "test-data/dropdown.docx")
            }).then(function(result) {
                var relevantWarnings = result.messages.filter(function(msg) {
                    return msg.message.toLowerCase().includes('dropdown') ||
                           msg.message.toLowerCase().includes('citation');
                });
                assert.equal(relevantWarnings.length, 0);
            });
        });
    });
});
