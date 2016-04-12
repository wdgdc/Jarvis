var util = {
    // shortcut for creating elements with attributes and innerHTML (not a fan of the jquery way)
    createElement:function(tag, atts, html) {
        var elem = document.createElement(tag);
        if (atts) {
            for(var att in atts) {
                if (atts.hasOwnProperty(att)) {
                    elem.setAttribute(att, atts[att]);
                }
            }
        }
        if (html) {
            elem.innerHTML = html;
        }
        return elem;
    },
    // returns boolean if page focus is in an editable area
    inputInFocus:function(e) {
        return /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.target.contentEditable === 'true';
    },
    isJarvisXhr:function(e, jqXHR, settings) {
        return /action=jarvis-search/.test(settings.url);
    },
    getComputedStyle:function(elem) {
        return (window.getComputedStyle) ? window.getComputedStyle(elem, false) : elem.currentStyle;
    },
    // trim whitespace from string
    trim:function(str) {
        return (String.prototype.trim) ? str.trim() : str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
};
