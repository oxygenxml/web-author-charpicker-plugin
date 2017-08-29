goog.provide('charpicker.Main');

goog.require('goog.i18n.CharPickerData');
goog.require('goog.i18n.uChar.LocalNameFetcher');
goog.require('goog.ui.CharPicker');


window["initCharPicker"] = function () {
  var cD = goog.dom.createDom;
  var insertBefore = goog.dom.insertSiblingBefore;

  var picker = new goog.ui.CharPicker(
    new goog.i18n.CharPickerData(),
    new goog.i18n.uChar.LocalNameFetcher());
  picker.render(el);

  var el = document.getElementById('char-picker');

  var parent = window.parent;
  parent["charsToBeInserted"] = [];
  var output = parent.document.getElementById('special_characters');

  // Action on selection
  var selectionAction = function () {
    var selectedChar = picker.getSelectedChar();
    output.value += selectedChar;
    parent["charsToBeInserted"].push(selectedChar);
  };

  var dropdowns = document.querySelectorAll(".goog-inline-block.goog-menu-button");
  var categoriesBar = cD("div", {id: "categories"},
    cD("div", { id: "label-categories" }, "Categories:"),
    cD("div", { id: 'dropdown-wrapper' }, dropdowns)
  );

  insertBefore(categoriesBar,
    document.getElementsByClassName("goog-char-picker")[0].firstChild);

  insertBefore(
    cD('span', { id: 'label-hexcode' }, "Hex code:"),
    document.querySelector(".goog-char-picker-uplus")
  );


  // Get selected locale from the char picker.
  goog.events.listen(picker, 'action', selectionAction);
};