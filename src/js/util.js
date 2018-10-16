var util = {
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
