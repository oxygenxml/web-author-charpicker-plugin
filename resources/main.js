goog.provide('charpicker.Main');

goog.require('goog.i18n.CharPickerData');
goog.require('goog.i18n.uChar.LocalNameFetcher');
goog.require('goog.ui.CharPicker');


charpicker.Main = function() {
};

charpicker.Main.prototype.init = function() {
   var picker = new goog.ui.CharPicker(new goog.i18n.CharPickerData(),
        new goog.i18n.uChar.LocalNameFetcher(),
        ["\uD869\uDED6", "a", "b", "c"], 10, 1);
    var el = goog.dom.getElement('char-picker');
    picker.render(el);

    // Action on selection
    var selectionAction = function() {
      parent.goog.dom.setTextContent(parent.goog.dom.getElement('pp_value'),
          picker.getSelectedChar());
    };

    // Get selected locale from the char picker.
    goog.events.listen(picker, 'action', function(e) { selectionAction(); });
}
