goog.provide('charpicker.Main');

goog.require('goog.i18n.CharPickerData');
goog.require('goog.i18n.uChar.LocalNameFetcher');
goog.require('goog.ui.CharPicker');


window["initCharPicker"] = function () {
    var picker = new goog.ui.CharPicker(new goog.i18n.CharPickerData(),
        new goog.i18n.uChar.LocalNameFetcher());
    var el = goog.dom.getElement('char-picker');
    picker.render(el);
    var parent = window.parent;
    parent["charsToBeInserted"] = [];
    var output = parent.document.getElementById('special_characters');
    // Action on selection
    var selectionAction = function () {
        output.value += picker.getSelectedChar();
        parent["charsToBeInserted"].push(picker.getSelectedChar());
    };
    var charpicker = document.getElementsByClassName("goog-char-picker")[0];

    var categoriesBar = document.createElement("div");
    categoriesBar.id = "categories";
    charpicker.insertBefore(categoriesBar, charpicker.firstChild);

    var label = document.createElement("div");
    label.id = "label-categories";
    label.innerHTML = "Categories:";
    categoriesBar.insertBefore(label, categoriesBar.firstChild);

    var wrapper = document.createElement("div");
    wrapper.id = "dropdown-wrapper";


    var dropdowns = document.querySelectorAll(".goog-inline-block.goog-menu-button");
    for(var i = 0; i < dropdowns.length; i++) {
        wrapper.appendChild(dropdowns[i]);
    }
    categoriesBar.insertBefore(wrapper, categoriesBar.firstChild.nextSibling);


    var hexCodeSpan = document.createElement("span");
    hexCodeSpan.id = "label-hexcode";
    hexCodeSpan.innerHTML = "Hex code:";
    charpicker.insertBefore(hexCodeSpan, document.querySelector(".goog-char-picker-uplus"));


    // Get selected locale from the char picker.
    goog.events.listen(picker, 'action', function (e) {
        selectionAction();
    });
};