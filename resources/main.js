goog.provide('charpicker.Main');

goog.require('goog.i18n.CharPickerData');
goog.require('goog.i18n.uChar.LocalNameFetcher');
goog.require('goog.ui.CharPicker');

window["initCharPicker"] = function () {
    var picker = new goog.ui.CharPicker(new goog.i18n.CharPickerData(),
        new goog.i18n.uChar.LocalNameFetcher());/*, ["\uD869\uDED6", "a", "b", "c"], 10, 1);*/
    var el = goog.dom.getElement('char-picker');
    picker.render(el);
    var parent = window.parent;
    //parent.charsToBeInserted = [];
    var output = parent.document.getElementById('special_characters');
    // Action on selection
    var selectionAction = function () {
        output.value += picker.getSelectedChar(); //+ output.innerHTML;
        parent.charsToBeInserted.push(picker.getSelectedChar());
    };

    // Get selected locale from the char picker.
    goog.events.listen(picker, 'action', function (e) {
        selectionAction();
    });
}