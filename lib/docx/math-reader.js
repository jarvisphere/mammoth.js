/**
 * Math Reader for Office Math Markup Language (OMML)
 * Converts OMML to LaTeX format
 */

var LATEX_SPECIAL_CHARS = ['{', '}', '_', '^', '#', '&', '$', '%', '~'];

var UNICODE_TO_LATEX = {
    '\u03B1': '\\alpha ', '\u03B2': '\\beta ', '\u03B3': '\\gamma ',
    '\u03B4': '\\delta ', '\u03B5': '\\epsilon ', '\u03B8': '\\theta ',
    '\u03BB': '\\lambda ', '\u03BC': '\\mu ', '\u03C0': '\\pi ',
    '\u03C3': '\\sigma ', '\u03C4': '\\tau ', '\u03C6': '\\phi ',
    '\u03C9': '\\omega ', '\u0393': '\\Gamma ', '\u0394': '\\Delta ',
    '\u039B': '\\Lambda ', '\u03A3': '\\Sigma ', '\u03A9': '\\Omega ',
    '\u2192': '\\rightarrow ', '\u2190': '\\leftarrow ',
    '\u2260': '\\ne ', '\u2264': '\\leq ', '\u2265': '\\geq ',
    '\u00B1': '\\pm ', '\u221E': '\\infty ', '\u2211': '\\sum ',
    '\u220F': '\\prod ', '\u222B': '\\int ', '\u2202': '\\partial '
};

var BIG_OPERATORS = {
    '\u2211': '\\sum', '\u220F': '\\prod', '\u222B': '\\int'
};

function escapeLatex(text) {
    if (!text) {
        return '';
    }
    var result = '';
    var lastChar = null;
    for (var i = 0; i < text.length; i++) {
        var char = text[i];
        if (LATEX_SPECIAL_CHARS.indexOf(char) !== -1 && lastChar !== '\\') {
            result += '\\' + char;
        } else {
            result += char;
        }
        lastChar = char;
    }
    return result;
}

function textToLatex(text) {
    if (!text) {
        return '';
    }
    var result = '';
    for (var i = 0; i < text.length; i++) {
        var char = text[i];
        var latexChar = UNICODE_TO_LATEX[char];
        if (latexChar) {
            result += latexChar;
        } else {
            result += char;
        }
    }
    return escapeLatex(result);
}

function extractText(element) {
    var text = [];
    function traverse(node) {
        if (!node) {
            return;
        }
        if (node.name === 'm:t' && node.children && node.children.length > 0) {
            node.children.forEach(function(child) {
                if (child.type === 'text') {
                    text.push(child.value);
                }
            });
        }
        if (node.children) {
            node.children.forEach(traverse);
        }
    }
    traverse(element);
    return text.join('');
}

function getChild(element, tagName) {
    if (!element || !element.children) {
        return null;
    }
    for (var i = 0; i < element.children.length; i++) {
        var child = element.children[i];
        if (child.name === tagName) {
            return child;
        }
    }
    return null;
}

function getPropValue(element, propTag, attrName) {
    var prop = getChild(element, propTag);
    if (prop && prop.attributes) {
        return prop.attributes[attrName];
    }
    return null;
}

function convertElement(element) {
    if (!element) {
        return '';
    }
    if (element.type === 'text') {
        return textToLatex(element.value);
    }
    if (element.type !== 'element') {
        return '';
    }
    var tag = element.name;
    switch (tag) {
    case 'm:oMath':
        return convertChildren(element);
    case 'm:r':
        return textToLatex(extractText(element));
    case 'm:sSup':
        return convertSuperscript(element);
    case 'm:sSub':
        return convertSubscript(element);
    case 'm:sSubSup':
        return convertSubSup(element);
    case 'm:f':
        return convertFraction(element);
    case 'm:rad':
        return convertRadical(element);
    case 'm:d':
        return convertDelimiter(element);
    case 'm:nary':
        return convertNary(element);
    case 'm:func':
        return convertFunction(element);
    case 'm:acc':
        return convertAccent(element);
    case 'm:bar':
        return convertBar(element);
    case 'm:e':
    case 'm:num':
    case 'm:den':
    case 'm:deg':
    case 'm:sup':
    case 'm:sub':
    case 'm:lim':
        return convertChildren(element);
    default:
        return convertChildren(element);
    }
}

function convertChildren(element) {
    if (!element || !element.children) {
        return '';
    }
    var result = [];
    element.children.forEach(function(child) {
        var latex = convertElement(child);
        if (latex) {
            result.push(latex);
        }
    });
    return result.join('');
}

function convertSuperscript(element) {
    var base = getChild(element, 'm:e');
    var sup = getChild(element, 'm:sup');
    if (!base || !sup) {
        return convertChildren(element);
    }
    return convertElement(base) + '^{' + convertElement(sup) + '}';
}

function convertSubscript(element) {
    var base = getChild(element, 'm:e');
    var sub = getChild(element, 'm:sub');
    if (!base || !sub) {
        return convertChildren(element);
    }
    return convertElement(base) + '_{' + convertElement(sub) + '}';
}

function convertSubSup(element) {
    var base = getChild(element, 'm:e');
    var sub = getChild(element, 'm:sub');
    var sup = getChild(element, 'm:sup');
    if (!base) {
        return convertChildren(element);
    }
    var result = convertElement(base);
    if (sub) {
        result += '_{' + convertElement(sub) + '}';
    }
    if (sup) {
        result += '^{' + convertElement(sup) + '}';
    }
    return result;
}

function convertFraction(element) {
    var num = getChild(element, 'm:num');
    var den = getChild(element, 'm:den');
    if (!num || !den) {
        return convertChildren(element);
    }
    var fType = getPropValue(element, 'm:fPr', 'm:type');
    if (fType === 'lin') {
        return convertElement(num) + '/' + convertElement(den);
    } else if (fType === 'noBar') {
        return '\\binom{' + convertElement(num) + '}{' + convertElement(den) + '}';
    } else {
        return '\\frac{' + convertElement(num) + '}{' + convertElement(den) + '}';
    }
}

function convertRadical(element) {
    var base = getChild(element, 'm:e');
    var deg = getChild(element, 'm:deg');
    if (!base) {
        return convertChildren(element);
    }
    if (deg) {
        return '\\sqrt[' + convertElement(deg) + ']{' + convertElement(base) + '}';
    } else {
        return '\\sqrt{' + convertElement(base) + '}';
    }
}

function convertDelimiter(element) {
    var base = getChild(element, 'm:e');
    if (!base) {
        return convertChildren(element);
    }
    var begChr = getPropValue(element, 'm:dPr', 'm:begChr');
    var endChr = getPropValue(element, 'm:dPr', 'm:endChr');
    var leftDelim = begChr || '(';
    var rightDelim = endChr || ')';
    return '\\left' + leftDelim + convertElement(base) + '\\right' + rightDelim;
}

function convertNary(element) {
    var base = getChild(element, 'm:e');
    var sub = getChild(element, 'm:sub');
    var sup = getChild(element, 'm:sup');
    var chr = getPropValue(element, 'm:naryPr', 'm:chr');
    var operator = BIG_OPERATORS[chr] || chr || '\\sum';
    var result = operator;
    if (sub) {
        result += '_{' + convertElement(sub) + '}';
    }
    if (sup) {
        result += '^{' + convertElement(sup) + '}';
    }
    if (base) {
        result += ' ' + convertElement(base);
    }
    return result;
}

function convertFunction(element) {
    var name = getChild(element, 'm:fName');
    var arg = getChild(element, 'm:e');
    if (!name || !arg) {
        return convertChildren(element);
    }
    var funcName = convertElement(name).trim();
    var knownFunctions = ['sin', 'cos', 'tan', 'log', 'ln', 'exp'];
    if (knownFunctions.indexOf(funcName) !== -1) {
        return '\\' + funcName + '(' + convertElement(arg) + ')';
    }
    return funcName + '(' + convertElement(arg) + ')';
}

function convertAccent(element) {
    var base = getChild(element, 'm:e');
    if (!base) {
        return convertChildren(element);
    }
    var chr = getPropValue(element, 'm:accPr', 'm:chr');
    var accents = {
        '\u0302': '\\hat',
        '\u0303': '\\tilde',
        '\u0304': '\\bar',
        '\u0307': '\\dot',
        '\u0308': '\\ddot',
        '\u20D7': '\\vec'
    };
    var accent = accents[chr] || '\\hat';
    return accent + '{' + convertElement(base) + '}';
}

function convertBar(element) {
    var base = getChild(element, 'm:e');
    if (!base) {
        return convertChildren(element);
    }
    var pos = getPropValue(element, 'm:barPr', 'm:pos');
    if (pos === 'bot') {
        return '\\underline{' + convertElement(base) + '}';
    } else {
        return '\\overline{' + convertElement(base) + '}';
    }
}

function extractMathText(element) {
    return convertElement(element);
}

function isMathElement(element) {
    return element.name === "m:oMath";
}

exports.isMathElement = isMathElement;
exports.extractMathText = extractMathText;
exports.convertElement = convertElement;
