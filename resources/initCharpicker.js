var cD = goog.dom.createDom;
var insertBefore = goog.dom.insertSiblingBefore;

var removeCategoriesOption = getURLParameter('remove-categories');
var categoriesToRemove = decodeURIComponent(removeCategoriesOption).split(',');

var charPickerData = new goog.i18n.CharPickerData();

// -------- Remove categories ---------------
goog.array.forEach(categoriesToRemove, function(category) {
  removeCategory(charPickerData, category.trim());
});

// -------- Translate category names --------
if (window['charpickerCategories']) {
  var customCategories = JSON.parse(window['charpickerCategories']);
  translateCategories(charPickerData, customCategories);
}

var localNameFetcher = new goog.i18n.uChar.LocalNameFetcher();
var picker = new goog.ui.CharPicker(charPickerData, localNameFetcher);

// Make it easier to add custom character categories.
var decompressor = null;
for (var prop in picker) {
  if (picker[prop] instanceof goog.i18n.CharListDecompressor) {
    decompressor = picker[prop];
    break;
  }
}
if (decompressor) {
  var toCharList = decompressor.toCharList;
  decompressor.toCharList = function(str) {
    if (goog.isArray(str)) {
      // Already decompressed.
      return str;
    } else {
      return toCharList.call(decompressor, str);
    }
  };
}

var el = document.getElementById('char-picker');
picker.render(el);

var parent = window.parent;
parent["charsToBeInserted"] = [];
parent["charsToBeInsertedTitles"] = {};
var output = parent.document.getElementById('special_characters');

// Action on selection
var selectionAction = function() {
  var selectedChar = picker.getSelectedChar() || '';
  if (selectedChar) {
    output.value += selectedChar;
    output.focus();
    parent["charsToBeInserted"].push(selectedChar);
    localNameFetcher.getName(selectedChar, function(charTitle) {
      if (charTitle) {
        var titleKey = '\'' + selectedChar + '\'';
        var currentTitle = parent["charsToBeInsertedTitles"][titleKey];
        if (!currentTitle) {
          parent["charsToBeInsertedTitles"][titleKey] = charTitle;
        }
      }
    });
  }
};

// Get the UI messages ready.
if (window['msgs']) {
  window['msgs'] = JSON.parse(window['msgs']);
}
var categoriesLabel = getTranslatedLabel('Categories', 'Categories:');
var hexCodeLabel = getTranslatedLabel('Hex_code', 'Hex code:');

var dropdowns = document.querySelectorAll(".goog-inline-block.goog-menu-button");
var categoriesBar = cD("div", { id: "categories" },
  cD("div", { id: "label-categories" }, categoriesLabel),
  cD("div", { id: 'dropdown-wrapper' }, dropdowns)
);

insertBefore(categoriesBar, document.getElementsByClassName("goog-char-picker")[0].firstChild);

// Make sure these inline elements will only wrap together.
var uplus = document.querySelector(".goog-char-picker-uplus");
var input = document.querySelector('.goog-char-picker-input-box');
var okButton = document.querySelector('.goog-char-picker-okbutton');

insertBefore(
  cD('span', { id: 'label-hexcode' }, hexCodeLabel),
  uplus
);

var noWrapContainer = cD('span', { id: 'nowrap-inlines' });
insertBefore(
  noWrapContainer,
  uplus
);

goog.dom.append(noWrapContainer,
  uplus,
  input,
  okButton
);

// Get selected locale from the char picker.
goog.events.listen(picker, 'action', selectionAction);
