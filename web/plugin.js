(function () {
    goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {

        var translations = {
            'BY_NAME_': {'en': 'By name'},
            'BY_CATEGORIES_': {'en': 'By categories'},
            'BY_CATEGORIES_OR_HEX_CODE_': {'en': 'By categories or hex code'},
            'NAME_OF_CHARACTER_': {'en': 'Name of character to search for:'},
            'MORE_SYMBOLS_': {'en': 'More symbols...'},
            'INSERT_SPECIAL_CHARACTERS_': {'en': 'Insert Special Characters'},
            'SELECTED_CHARACTERS_': { 'en': 'Selected characters:' },
            'REMOVE_LAST_CHARACTER_': { 'en': 'Remove last character' },
            'INSERT_SPECIAL_CHARACTERS_TOOLTIP_': { 'en': 'Insert special characters.' }
        };
        sync.Translation.addTranslations(translations);

        //quickly change urls that have the plugin name hardcoded
        var pluginResourcesFolder = 'char-picker';

        var localStorageUsable = function () { return typeof (Storage) !== 'undefined'; };
        var storedRecentChars = function () { return localStorage.getItem("recentlyUsedCharacters"); };
        var capitalizeWords = function(text) {
            var splitText = text.toLowerCase().split(' ');
            for(var i = 0; i < splitText.length; i++) {
                splitText[i] = splitText[i].substr(0,1).toUpperCase() + splitText[i].substring(1);
            }
            return splitText.join(' ');
        };
        var displayRecentCharacters = function () {
            var defaultRecentCharacters = ["\u20ac", "\u00a3", "\u00a5", "\u00a2", "\u00a9", "\u00ae", "\u2122", "\u03b1", "\u03b2", "\u03c0", "\u03bc",
                "\u03a3", "\u03a9", "\u2264", "\u2265", "\u2260", "\u221e", "\u00b1", "\u00f7", "\u00d7", "\u21d2"];
            /* selector for targeting the recent characters container */
            var container = document.querySelector('.recentCharactersGrid');

            /* remove all recent characters to add the new ones again */
            var fc = container.firstChild;
            while( fc ) {
                container.removeChild( fc );
                fc = container.firstChild;
            }

            var characters = [];
            if (localStorageUsable()) {
                if (storedRecentChars()) {
                    characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                }
            }

            /* adjust the character array so it is the desired length.
             Fill it up with default recent characters if needed.  */
            var maxChars = 21;
            if (characters.length < maxChars) {
                characters = characters.concat(defaultRecentCharacters);
                goog.array.removeDuplicates(characters);
                characters = characters.slice(0, maxChars);
                localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
            } else if (characters.length > maxChars) {
                characters = characters.slice(0, maxChars);
                localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
            }
            /* add the characters to the container */
            for (i = 0; i < characters.length; i++) {
                container.appendChild(goog.dom.createDom('div', {
                        'class': 'goog-inline-block goog-flat-button char-select-button'
                    },
                    characters[i]));
            }
        };
        var updateCharPreview = function(e) {
            var symbol = e.target.textContent;
            var symbolCode = e.target.getAttribute('data-symbol-hexcode');
            var symbolName = e.target.getAttribute('data-symbol-name');

            var previewCharacterDetails = document.getElementById('previewCharacterDetails');

            previewCharacterDetails.innerHTML = '';
            goog.dom.appendChild(previewCharacterDetails, goog.dom.createDom('div', { 'id': 'previewSymbol' }, symbol));
            goog.dom.appendChild(previewCharacterDetails, goog.dom.createDom(
                'div', { 'id': 'previewSymbolName' },
                symbolName,
                goog.dom.createDom('span', { 'style': 'white-space: nowrap; vertical-align: top' }, ' (' + symbolCode + ')')
            ));
        };

        var InsertFromMenuAction = function (editor) {
            this.editor = editor;
            this.dialog = workspace.createDialog();
            this.dialog.setTitle(tr(msgs.INSERT_SPECIAL_CHARACTERS_));
        };
        InsertFromMenuAction.prototype = new sync.actions.AbstractAction('');
        InsertFromMenuAction.prototype.getDisplayName = function () {
            return 'insert from menu';
        };

        var myIconUrl = sync.util.computeHdpiIcon('../plugin-resources/' + pluginResourcesFolder + '/InsertFromCharactersMap24.png');
        InsertFromMenuAction.prototype.getLargeIcon = function () {
            return myIconUrl;
        };

        InsertFromMenuAction.prototype.displayDialog = function () {

            // Resize the dialog when the window resizes (keep it usable on smaller devices after the keyboard pops up).
            var resizeListenerKey = goog.events.listen(window, goog.events.EventType.RESIZE, goog.bind(function () {
                this.dialog.setPreferredSize(420, 550);
            }, this));

            goog.events.listenOnce(this.dialog.dialog, goog.ui.Dialog.EventType.AFTER_HIDE, function () {
                goog.events.unlistenByKey(resizeListenerKey);
            });

            window.charsToBeInserted = [];
            // if dialog has not been opened yet, load it
            if(document.getElementById('charpickeriframe') === null) {
                var tabContainer = goog.dom.createDom(
                    'div', 'tabsContainer',
                    goog.dom.createDom(
                        'ul', '',
                        goog.dom.createDom(
                            'li', '',
                            goog.dom.createDom('input', { 'id': 'tabsContainer-0-0', 'type': 'radio', 'name': 'tabsContainer-0', 'checked': 'checked' }),
                            goog.dom.createDom('label', { 'for': 'tabsContainer-0-0' }, tr(msgs.BY_NAME_)),
                            goog.dom.createDom(
                                'div', { 'id': 'charpicker-search-by-name' },
                                goog.dom.createDom(
                                    'div', {'style': 'line-height: 1.2em; height: 57px;'},
                                    tr(msgs.NAME_OF_CHARACTER_),
                                    goog.dom.createDom('br'),
                                    goog.dom.createDom('input', { 'id': 'searchName', 'class': 'charpicker-input', 'type': 'text', 'name': 'searchName' })
                                ),
                                goog.dom.createDom('div', {'id': 'foundByNameList'}),
                                goog.dom.createDom('div', {'id': 'previewCharacterDetails'})
                            )
                        ),
                        goog.dom.createDom(
                            'li', '',
                            goog.dom.createDom('input', { 'id': 'tabsContainer-0-1', 'type': 'radio', 'name': 'tabsContainer-0' }),
                            goog.dom.createDom(
                                'label', { 'for': 'tabsContainer-0-1' },
                                goog.dom.createDom('span', 'low-width-hide', tr(msgs.BY_CATEGORIES_OR_HEX_CODE_)),
                                goog.dom.createDom('span', 'big-width-hide', tr(msgs.BY_CATEGORIES_))
                            ),
                            goog.dom.createDom('div', { 'id': 'charpicker-advanced' })
                        )
                    )
                );

                var charPickerIframe = goog.dom.createDom('iframe', {
                    'id': 'charpickeriframe',
                    'src': '../plugin-resources/' + pluginResourcesFolder + '/charpicker.html'
                });
                this.dialog.getElement().id = 'charPicker';
                goog.dom.appendChild(this.dialog.getElement(), tabContainer);

                this.dialog.getElement().parentElement.classList.add("dialogContainer");

                goog.events.listen(document.getElementById('foundByNameList'),
                    goog.events.EventType.MOUSEOVER,
                    function (e){
                        if(e.target.id !== 'foundByNameList'){
                            updateCharPreview(e);
                        }
                    }
                );
                goog.events.listen(document.getElementById('foundByNameList'),
                    goog.events.EventType.CLICK,
                    function (e){
                        if(e.target.id !== 'foundByNameList'){
                            updateCharPreview(e);
                            var symbol = e.target.textContent;
                            charsToBeInserted.push(symbol);
                            document.getElementById('special_characters').value += symbol;
                        }
                    }
                );

                goog.require('goog.net.XhrIo');
                var findCharByName = function() {
					
					var name = document.getElementById("searchName").value;

					// clear boxes to get ready for results
                    document.getElementById("foundByNameList").innerHTML = '';
                    document.getElementById("previewCharacterDetails").innerHTML = '';

                    if(name.length !== 0){
						var url = "../plugins-dispatcher/charpicker-plugin?q=" + encodeURIComponent(name);
						goog.net.XhrIo.send(url, function(e){
							var xhr = e.target;
							var obj = xhr.getResponseJson();

							for(var code in obj) {
								var foundByNameItem = goog.dom.createDom('div', {'class': 'characterListSymbol', 'data-symbol-name': capitalizeWords(obj[code]), 'data-symbol-hexcode': code});
								var decimalCode = parseInt(code, 16);
								foundByNameItem.textContent = String.fromCharCode(decimalCode);
								document.getElementById("foundByNameList").appendChild(foundByNameItem);
							}
							localStorage.setItem("lastCharacterSearch", name);
						}, "GET");
                    }
                };
                

                // execute query automatically after user stops typing
                var typingPause = 500;
                var timeoutfunction;
				
				// execute query immediately when user presses enter in the input, prevent dialog closing
                goog.events.listen(document.getElementById('searchName'), goog.events.EventType.KEYDOWN, function(e){
                        if(e.keyCode === 13) {
                            e.preventDefault();
							clearTimeout(timeoutfunction);
                            findCharByName();
                        }
                    }
                );
				
				// execute query after delay on keyup
                goog.events.listen(document.getElementById("searchName"),
                    goog.events.EventType.KEYUP,
                    function(e) {
                        // if the key is enter a search is triggered already on keydown
                        if (e.keyCode !== 13){
							clearTimeout(timeoutfunction);
                            timeoutfunction = setTimeout(findCharByName, typingPause);
                        }
                    }
                );

                document.getElementById('charpicker-advanced').appendChild(charPickerIframe);

                var readOnlyInput = goog.dom.createDom(
                    'input',
                    {
                        'id': 'special_characters',
                        'class': 'charpicker-input',
                        'type': 'text',
                        'name': 'charsToBeInserted'
                    }
                );
                readOnlyInput.setAttribute('readonly', true);
                readOnlyInput.setAttribute('onFocus', 'this.setSelectionRange(0, this.value.length)');

                var div = goog.dom.createDom(
                    'div', { 'id': 'selectedCharsWrapper' },
                    goog.dom.createDom('span', '', tr(msgs.SELECTED_CHARACTERS_)),
                    readOnlyInput,
                    goog.dom.createDom(
                        'button',
                        {
                            'id': 'removeLastChar',
                            'class': 'goog-button goog-char-picker-okbutton',
                            'title': tr(msgs.REMOVE_LAST_CHARACTER_),
                            'value': ''
                        }
                    )
                );

                goog.dom.appendChild(this.dialog.getElement(), div);

                var textarea = document.getElementById('special_characters');
                textarea.scrollTop = textarea.scrollHeight;
                goog.events.listen(this.dialog.getElement().querySelector('#removeLastChar'), goog.events.EventType.CLICK, function(){
                    var preview = document.getElementById('special_characters');
                    preview.value = '';
                    charsToBeInserted.pop();
                    for(var i = 0; i < charsToBeInserted.length; i++){
                        preview.value += charsToBeInserted[i];
                    }
                });

            }
            // if dialog has been populated already just reset the textboxes
            else {
                this.dialog.getElement().querySelector('#special_characters').value = '';
                var searchbox = this.dialog.getElement().querySelector('#searchName');
				searchbox.value = '';
                if(localStorage.getItem("lastCharacterSearch") !== null){
                    searchbox.setAttribute("placeholder", localStorage.getItem("lastCharacterSearch") );
                }
                var iframe = this.dialog.getElement().querySelector('#charpickeriframe');
                var iframeContent = (iframe.contentWindow || iframe.contentDocument);
                if (iframeContent.document) {
                    iframeContent = iframeContent.document;
                    iframeContent.querySelector('.goog-char-picker-input-box').value = '';
                }
                else {
                    console.log('failed to get iframe contents');
                }
            }


            this.dialog.onSelect(function (key) {
                // DIALOG INSERT GRID
                if (key == 'ok') {
                    var dialogInsertChars = charsToBeInserted;
                    if (dialogInsertChars) {
                        var stringifiedText = '';
                        for(i = 0; i < dialogInsertChars.length; i++){
                            stringifiedText += dialogInsertChars[i];
                        }
                        editor.getActionsManager().invokeOperation(
                            'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
                                fragment: stringifiedText
                            },
                            function () {
                                if (localStorageUsable()) {
                                    /* if using the localStorage is possible, add the text to the START of the array - queue system */
                                    if (storedRecentChars()) {
                                        var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                                        characters = (dialogInsertChars.reverse()).concat(characters);
                                        goog.array.removeDuplicates(characters);
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                                        displayRecentCharacters();
                                    } else {
                                        characters = dialogInsertChars;
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                                        displayRecentCharacters();
                                    }
                                }
                            })
                    }
                }
            });

            this.dialog.show();
        };

        InsertFromMenuAction.prototype.init = function () {
            window.charsToBeInserted = [];

            this.csmenu = new goog.ui.PopupMenu();

            //overwrite the handleBlur function to prevent the popup from closing after inserting a character
            this.csmenu.handleBlur = function () {
            };

            var moreSymbols = new goog.ui.MenuItem(goog.string.htmlEscape(tr(msgs.MORE_SYMBOLS_)));
            this.csmenu.addChild(moreSymbols, true);
            moreSymbols.setId('moreSymbolsButton');

            goog.events.listen(moreSymbols, goog.ui.Component.EventType.ACTION, goog.bind(this.displayDialog, this));

            this.csmenu.render();
            goog.dom.setProperties(this.csmenu.getElement(), {'id': 'pickermenu'});

            // add the characters grid before the "more symbols..." button
            var parentElement = this.csmenu.getElement();
            var theFirstChild = parentElement.firstChild;
            var newElement = goog.dom.createDom('div', {
                'class': 'goog-char-picker-grid recentCharactersGrid',
                'id': 'simplePickerGrid'
            });
            parentElement.insertBefore(newElement, theFirstChild);

            this.csmenu.setToggleMode(true);

            // QUICK INSERT GRID
            goog.events.listen(document.querySelector('.goog-char-picker-grid'),
                goog.events.EventType.CLICK,
                function (e) {
                    if (goog.dom.classlist.contains(e.target, 'goog-flat-button')) {
                        editor.getActionsManager().invokeOperation(
                            'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
                                fragment: e.target.textContent
                            },
                            function () {
                                var quickInsertChar = e.target.textContent;
                                if (localStorageUsable()) {
                                    /* if using the localStorage is possible, add the character to the START of the array - queue system */
                                    if (storedRecentChars()) {
                                        var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                                        characters.unshift(quickInsertChar);
                                        goog.array.removeDuplicates(characters);
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));

                                    } else {
                                        characters = [];
                                        characters.unshift(quickInsertChar);
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                                    }
                                }
                            })
                    }
                });
        };


        InsertFromMenuAction.prototype.actionPerformed = function (callback) {
            if (this.csmenu.isOrWasRecentlyVisible()) {
                this.csmenu.hide();
            } else {
                displayRecentCharacters();
                this.csmenu.showAtElement(
                    document.querySelector('[name=insertfrommenu]'),
                    goog.positioning.Corner.BOTTOM_START);
            }
        };
        var editor = e.editor;

        var insertFromMenu = new InsertFromMenuAction(editor);
        editor.getActionsManager().registerAction('insertfrommenu', insertFromMenu);

        var addActionOnce = 0;
        addToFrameworkToolbar(editor);

        function addToFrameworkToolbar(editor) {
            goog.events.listen(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function (e) {
                var actionsConfig = e.actionsConfiguration;

                var frameworkToolbar = null;
                if (actionsConfig.toolbars) {
                    for (var i = 0; i < actionsConfig.toolbars.length; i++) {
                        var toolbar = actionsConfig.toolbars[i];
                        if (toolbar.name !== "Review" && toolbar.name !== "Builtin") {
                            frameworkToolbar = toolbar;
                        }
                    }
                }
                // adds the action only once, on the first toolbar that is not Review or Builtin
                if (frameworkToolbar && addActionOnce === 0) {
                    addActionOnce++;
                    frameworkToolbar.children.push({
                            id: 'insertfrommenu',
                            type: "action"
                        });
                    setTimeout(function () {
                        insertFromMenu.init();
                        document.getElementsByName("insertfrommenu")[0].setAttribute("title", tr(msgs.INSERT_SPECIAL_CHARACTERS_TOOLTIP_));
                    }, 0)
                }
            });
        };
        sync.util.loadCSSFile("../plugin-resources/" + pluginResourcesFolder + "/css/plugin.css");
    })
})();