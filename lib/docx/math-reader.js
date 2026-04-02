/**
 * Math Reader for Office Math Markup Language (OMML)
 * Converts OMML to LaTeX format
 */

var LATEX_SPECIAL_CHARS = ['{', '}', '_', '^', '#', '&', '$', '%', '~'];

var KNOWN_FUNCTIONS = ['arcsin', 'arccos', 'arctan',
    'sinh', 'cosh', 'tanh', 'coth',
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'log', 'ln', 'exp', 'det', 'dim', 'gcd', 'hom',
    'ker', 'lim', 'inf', 'sup', 'min', 'max', 'deg', 'arg',
    'Pr', 'limsup', 'liminf'];

var UNICODE_TO_LATEX = {
    // Lowercase Greek
    '\u03B1': '\\alpha ', '\u03B2': '\\beta ', '\u03B3': '\\gamma ',
    '\u03B4': '\\delta ', '\u03B5': '\\varepsilon ', '\u03B6': '\\zeta ',
    '\u03B7': '\\eta ', '\u03B8': '\\theta ', '\u03B9': '\\iota ',
    '\u03BA': '\\kappa ', '\u03BB': '\\lambda ', '\u03BC': '\\mu ',
    '\u03BD': '\\nu ', '\u03BE': '\\xi ', '\u03C0': '\\pi ',
    '\u03C1': '\\rho ', '\u03C3': '\\sigma ', '\u03C4': '\\tau ',
    '\u03C5': '\\upsilon ', '\u03C6': '\\phi ', '\u03C7': '\\chi ',
    '\u03C8': '\\psi ', '\u03C9': '\\omega ',
    '\u03F5': '\\epsilon ',

    // Uppercase Greek
    '\u0393': '\\Gamma ', '\u0394': '\\Delta ', '\u0398': '\\Theta ',
    '\u039B': '\\Lambda ', '\u039E': '\\Xi ', '\u03A0': '\\Pi ',
    '\u03A3': '\\Sigma ', '\u03A6': '\\Phi ', '\u03A8': '\\Psi ',
    '\u03A9': '\\Omega ',

    // Arrows
    '\u2192': '\\rightarrow ', '\u2190': '\\leftarrow ',
    '\u21D2': '\\Rightarrow ', '\u21D0': '\\Leftarrow ',
    '\u2194': '\\leftrightarrow ', '\u21D4': '\\Leftrightarrow ',
    '\u2191': '\\uparrow ', '\u2193': '\\downarrow ',
    '\u21A6': '\\mapsto ',

    // Relations
    '\u2260': '\\ne ', '\u2264': '\\leq ', '\u2265': '\\geq ',
    '\u2248': '\\approx ', '\u2261': '\\equiv ', '\u2245': '\\cong ',
    '\u223C': '\\sim ', '\u221D': '\\propto ', '\u226A': '\\ll ',
    '\u226B': '\\gg ', '\u227A': '\\prec ', '\u227B': '\\succ ',

    // Binary operators
    '\u00B1': '\\pm ', '\u2213': '\\mp ', '\u00D7': '\\times ',
    '\u00F7': '\\div ', '\u2217': '*', '\u22C6': '\\star ',
    '\u2218': '\\circ ', '\u2219': '\\bullet ',

    // Set and logic
    '\u2208': '\\in ', '\u2209': '\\notin ', '\u220B': '\\ni ',
    '\u2282': '\\subset ', '\u2283': '\\supset ',
    '\u2286': '\\subseteq ', '\u2287': '\\supseteq ',
    '\u222A': '\\cup ', '\u2229': '\\cap ',
    '\u2200': '\\forall ', '\u2203': '\\exists ', '\u2204': '\\nexists ',
    '\u2205': '\\emptyset ',
    '\u2227': '\\land ', '\u2228': '\\lor ', '\u00AC': '\\neg ',

    // Big operators & calculus
    '\u2211': '\\sum ', '\u220F': '\\prod ', '\u2210': '\\coprod ',
    '\u222B': '\\int ', '\u222C': '\\iint ', '\u222D': '\\iiint ',
    '\u222E': '\\oint ',

    // Misc math
    '\u2207': '\\nabla ', '\u2202': '\\partial ', '\u221E': '\\infty ',
    '\u22C5': '\\cdot ', '\u2026': '\\ldots ', '\u22EF': '\\cdots ',
    '\u22EE': '\\vdots ', '\u22F1': '\\ddots ',
    '\u2032': "'", '\u2033': "''",
    '\u210F': '\\hbar ', '\u2113': '\\ell ',
    '\u2118': '\\wp ', '\u211C': '\\Re ', '\u2111': '\\Im ',
    '\u2135': '\\aleph ',
    '\u2212': '-',
    '\u22C4': '\\diamond '
};

var BIG_OPERATORS = {
    '\u2211': '\\sum', '\u220F': '\\prod', '\u222B': '\\int',
    '\u222C': '\\iint', '\u222D': '\\iiint', '\u222E': '\\oint',
    '\u2210': '\\coprod'
};

var UPPER_LIMIT_ACCENTS = {
    '\u2192': '\\vec',
    '\u20D7': '\\vec',
    '\u0302': '\\hat',
    '\u0303': '\\tilde',
    '\u0304': '\\bar',
    '\u0305': '\\overline',
    '\u0307': '\\dot',
    '\u0308': '\\ddot',
    '\u02D9': '\\dot',
    '\u00AF': '\\overline',
    '\u02DC': '\\tilde',
    '\u005E': '\\hat',
    '\u0060': '\\grave',
    '\u00B4': '\\acute',
    '\u02C7': '\\check',
    '\u02D8': '\\breve',
    '\u20D6': '\\overleftarrow',
    '\u2190': '\\overleftarrow'
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
        if (char === '\u2061') {
            // U+2061 Function Application: look back for known function names
            // (longer names checked first to match "arcsin" before "sin")
            for (var j = 0; j < KNOWN_FUNCTIONS.length; j++) {
                var fn = KNOWN_FUNCTIONS[j];
                if (result.length >= fn.length &&
                    result.substring(result.length - fn.length) === fn) {
                    result = result.substring(0, result.length - fn.length) + '\\' + fn;
                    break;
                }
            }
        } else {
            var latexChar = UNICODE_TO_LATEX[char];
            if (latexChar) {
                result += latexChar;
            } else {
                result += char;
            }
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

function getChildren(element, tagName) {
    if (!element || !element.children) {
        return [];
    }
    var result = [];
    for (var i = 0; i < element.children.length; i++) {
        if (element.children[i].name === tagName) {
            result.push(element.children[i]);
        }
    }
    return result;
}

function getPropValue(element, propTag, childTag) {
    var prop = getChild(element, propTag);
    if (!prop) {
        return null;
    }
    var child = getChild(prop, childTag);
    if (child && child.attributes && child.attributes['m:val'] !== undefined) {
        return child.attributes['m:val'];
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
    case 'm:r': {
        var runText = extractText(element);
        var rPr = getChild(element, 'm:rPr');
        if (rPr && getChild(rPr, 'm:nor')) {
            return '\\text{' + runText + '}';
        }
        return textToLatex(runText);
    }
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
    case 'm:m':
        return convertMatrix(element);
    case 'm:eqArr':
        return convertEqArray(element);
    case 'm:limUpp':
        return convertLimUpp(element);
    case 'm:limLow':
        return convertLimLow(element);
    case 'm:groupChr':
        return convertGroupChar(element);
    case 'm:borderBox':
    case 'm:box':
        return convertBox(element);
    case 'm:e':
    case 'm:num':
    case 'm:den':
    case 'm:deg':
    case 'm:sup':
    case 'm:sub':
    case 'm:lim':
    case 'm:fName':
        return convertChildren(element);
    case 'm:mPr':
    case 'm:mcs':
    case 'm:mc':
    case 'm:mcPr':
    case 'm:ctrlPr':
    case 'm:rPr':
    case 'm:sSubPr':
    case 'm:sSupPr':
    case 'm:sSubSupPr':
    case 'm:fPr':
    case 'm:naryPr':
    case 'm:dPr':
    case 'm:radPr':
    case 'm:accPr':
    case 'm:barPr':
    case 'm:funcPr':
    case 'm:eqArrPr':
    case 'm:limUppPr':
    case 'm:limLowPr':
    case 'm:groupChrPr':
    case 'm:borderBoxPr':
    case 'm:boxPr':
        return '';
    default:
        return convertChildren(element);
    }
}

function convertChildren(element) {
    if (!element || !element.children) {
        return '';
    }
    var children = element.children;
    var result = [];
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var handled = false;
        // Detect { text run followed by m:m matrix → \begin{cases}
        if (child.name === 'm:r' && i + 1 < children.length &&
            children[i + 1].name === 'm:m') {
            var rawText = extractText(child).trim();
            if (rawText === '{') {
                result.push(convertCases(children[i + 1]));
                i++;
                handled = true;
            }
        }
        if (!handled) {
            var latex = convertElement(child);
            if (latex) {
                result.push(latex);
            }
        }
    }
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
        var degLatex = convertElement(deg);
        if (degLatex) {
            return '\\sqrt[' + degLatex + ']{' + convertElement(base) + '}';
        }
    }
    return '\\sqrt{' + convertElement(base) + '}';
}

function convertDelimiter(element) {
    var elements = getChildren(element, 'm:e');
    if (elements.length === 0) {
        return convertChildren(element);
    }
    var begChr = getPropValue(element, 'm:dPr', 'm:begChr');
    var endChr = getPropValue(element, 'm:dPr', 'm:endChr');
    var sepChr = getPropValue(element, 'm:dPr', 'm:sepChr');
    var leftDelim = begChr !== null ? begChr : '(';
    var rightDelim = endChr !== null ? endChr : ')';
    var separator = sepChr || '|';

    var content = elements.map(function(e) {
        return convertElement(e);
    }).join(separator);

    if (leftDelim === '' && rightDelim === '') {
        return content;
    }
    return '\\left' + (leftDelim || '.') + content + '\\right' + (rightDelim || '.');
}

function convertNary(element) {
    var base = getChild(element, 'm:e');
    var sub = getChild(element, 'm:sub');
    var sup = getChild(element, 'm:sup');
    var chr = getPropValue(element, 'm:naryPr', 'm:chr');
    var operator = BIG_OPERATORS[chr] || chr || '\\sum';
    var result = operator;
    if (sub) {
        var subContent = convertElement(sub);
        if (subContent) {
            result += '_{' + subContent + '}';
        }
    }
    if (sup) {
        var supContent = convertElement(sup);
        if (supContent) {
            result += '^{' + supContent + '}';
        }
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
    var knownFunctions = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
        'log', 'ln', 'exp', 'det', 'dim', 'gcd', 'hom',
        'ker', 'lim', 'inf', 'sup', 'min', 'max', 'deg', 'arg'];
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
        '\u0305': '\\overline',
        '\u0307': '\\dot',
        '\u0308': '\\ddot',
        '\u20D7': '\\vec',
        '\u2192': '\\vec',
        '\u02D9': '\\dot',
        '\u02DC': '\\tilde',
        '\u005E': '\\hat',
        '\u00AF': '\\overline'
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

function convertMatrixRows(element) {
    var rows = getChildren(element, 'm:mr');
    var rowStrings = [];
    for (var i = 0; i < rows.length; i++) {
        var cells = getChildren(rows[i], 'm:e');
        var cellStrings = cells.map(function(cell) {
            return convertElement(cell);
        });
        var hasContent = cellStrings.some(function(s) {
            return s.trim() !== '';
        });
        if (hasContent) {
            rowStrings.push(cellStrings.join(' & '));
        }
    }
    return rowStrings;
}

function convertMatrix(element) {
    var rows = getChildren(element, 'm:mr');
    if (rows.length === 0) {
        return convertChildren(element);
    }
    var rowStrings = convertMatrixRows(element);
    if (rowStrings.length === 0) {
        return '';
    }
    if (rowStrings.length === 1) {
        return rowStrings[0];
    }
    return '\\begin{aligned}\n' + rowStrings.join(' \\\\\n') + '\n\\end{aligned}';
}

function convertCases(element) {
    var rows = getChildren(element, 'm:mr');
    if (rows.length === 0) {
        return convertChildren(element);
    }
    var rowStrings = convertMatrixRows(element);
    if (rowStrings.length === 0) {
        return '';
    }
    return '\\begin{cases} ' + rowStrings.join(' \\\\ ') + ' \\end{cases}';
}

function convertEqArray(element) {
    var rows = getChildren(element, 'm:e');
    if (rows.length === 0) {
        return convertChildren(element);
    }
    var rowStrings = rows.map(function(row) {
        return convertElement(row);
    });
    if (rows.length === 1) {
        return rowStrings[0];
    }
    return '\\begin{aligned}\n' + rowStrings.join(' \\\\\n') + '\n\\end{aligned}';
}

function convertLimUpp(element) {
    var base = getChild(element, 'm:e');
    var lim = getChild(element, 'm:lim');
    if (!base || !lim) {
        return convertChildren(element);
    }
    var limText = extractText(lim);
    var accent = UPPER_LIMIT_ACCENTS[limText];
    if (accent) {
        return accent + '{' + convertElement(base) + '}';
    }
    return '\\overset{' + convertElement(lim) + '}{' + convertElement(base) + '}';
}

function convertLimLow(element) {
    var base = getChild(element, 'm:e');
    var lim = getChild(element, 'm:lim');
    if (!base || !lim) {
        return convertChildren(element);
    }
    return '\\underset{' + convertElement(lim) + '}{' + convertElement(base) + '}';
}

function convertGroupChar(element) {
    var base = getChild(element, 'm:e');
    if (!base) {
        return convertChildren(element);
    }
    var chr = getPropValue(element, 'm:groupChrPr', 'm:chr');
    var pos = getPropValue(element, 'm:groupChrPr', 'm:pos');
    if (chr === '\u23DF' || chr === '\uFE38') {
        if (pos === 'top') {
            return '\\overbrace{' + convertElement(base) + '}';
        }
        return '\\underbrace{' + convertElement(base) + '}';
    }
    if (chr === '\u23DE' || chr === '\uFE37') {
        if (pos === 'bot') {
            return '\\underbrace{' + convertElement(base) + '}';
        }
        return '\\overbrace{' + convertElement(base) + '}';
    }
    return convertElement(base);
}

function convertBox(element) {
    var base = getChild(element, 'm:e');
    if (!base) {
        return convertChildren(element);
    }
    return convertElement(base);
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
