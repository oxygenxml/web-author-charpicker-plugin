(function () {
    goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {

        var localStorageUsable = function () {
            if (typeof (Storage) !== 'undefined') {
                return 1;
            }
            else {
                console.log('localstorage not supported');
                return 0;
            }
        }
        var storedRecentChars = function () {
            if (localStorage.getItem("recentlyUsedCharacters")) {
                return 1;
            }
            else{
                console.log('there are no recentCharacters set');
                return 0;
            }
        }
        var removeDuplicates = function (arr) {
            return arr.filter(function(item, pos) {
                return arr.indexOf(item) == pos;
            });
        }

        var displayRecentCharacters = function () {
            //todo: fill up the default chars
            var defaultRecentCharacters = ["\u00e9", "\u2665", "❤", "\uD834\uDD1E", "\u00A9", "\u00a9", "\u1f44c", "a", "b", "c", "3", "6", "a", "b", "c", "3", "6"];
            /* selector for targeting the recent characters container */
            var selector = '.recentCharactersGrid';
            var container = document.querySelector(selector);

            /* remove all recent characters to add the new ones again */
            var fc = container.firstChild;
            while( fc ) {
                container.removeChild( fc );
                fc = container.firstChild;
            }

            var characters = [];
            //check if this check for undefined is ok
            if (localStorageUsable()) {
                if (storedRecentChars()) {
                    characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                }
            }

            /* adjust the character array so it is the desired length.
             Fill it up with default recent characters if needed.  */
            var maxChars = 20;
            if (characters.length < maxChars) {
                characters = characters.concat(defaultRecentCharacters);
                characters = removeDuplicates(characters).slice(0, maxChars);
                localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
            } else if (characters.length > maxChars) {
                characters = characters.slice(0, maxChars);
                localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
            }
            /* add the characters to the container */
            for (i = 0; i < characters.length; i++) {
                document.querySelector(selector).appendChild(goog.dom.createDom('div', {
                        'class': 'goog-inline-block goog-flat-button char-select-this-button'
                    },
                    characters[i]));
            }
        }


        InsertFromMenuAction = function (editor) {
            this.editor = editor;
            this.dialog = workspace.createDialog();
            this.dialog.setTitle('Insert Special Characters');
            this.dialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.OK_CANCEL);
        };
        InsertFromMenuAction.prototype = new sync.actions.AbstractAction('');
        InsertFromMenuAction.prototype.getDisplayName = function () {
            return 'insert from menu';
        };
        var myIconUrl = sync.util.computeHdpiIcon('../plugin-resources/char-picker/InsertFromCharactersMap24.png');
        InsertFromMenuAction.prototype.getLargeIcon = function () {
            return myIconUrl;
        };
        InsertFromMenuAction.prototype.displayDialog = function () {
            charsToBeInserted = [];
            // todo check this condition
            // if dialog has not been opened yet, load it
            if(document.querySelector('#charpickeriframe') === null) {
                var charPickerIframe = goog.dom.createDom('iframe', {
                    'id': 'charpickeriframe',
                    'style': 'width:400px;height:400px;border:none;',
                    'src': '../plugin-resources/char-picker/charpicker.html'
                });
                this.dialog.getElement().appendChild(charPickerIframe);
                this.dialog.getElement().innerHTML += '<div>Insert characters:<input type="text" name="charsToBeInserted" id="special_characters" style="margin-left:10px;"/></div>';
            }
            // if dialog has been populated already just reset the textbox
            else {
                this.dialog.getElement().querySelector('#special_characters').value = '';
            }


            this.dialog.onSelect(function (key) {
                // DIALOG INSERT GRID
                if (key == 'ok') {
                    var dialogInsertChars = charsToBeInserted;
                    if (dialogInsertChars) {
                        var stringifiedText = '';
                        for(i=0;i<dialogInsertChars.length;i++){
                            stringifiedText += dialogInsertChars[i];
                        }
                        //this.editor.getActionsManager().invokeOperation(
                        editor.getActionsManager().invokeOperation(
                            'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
                                fragment: stringifiedText
                            },
                            function () {
                                //console.log('callback from invokeOperation', localStorage.getItem("recentlyUsedCharacters"));
                                if (localStorageUsable()) {
                                    /* if using the localStorage is possible, add the text to the START of the array - queue system */
                                    if (storedRecentChars()) {
                                        console.log(dialogInsertChars);
                                        var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                                        characters = (dialogInsertChars.reverse()).concat(characters);
                                        characters = removeDuplicates(characters);
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                                        displayRecentCharacters();

                                        console.log('called refresh from dialog');
                                    } else {
                                        console.log('characters not found in localstorage, creating...');
                                        characters = dialogInsertChars;
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                                        displayRecentCharacters();
                                        console.log('finally', characters);
                                    }
                                }
                            })
                    } else {
                        //todo theres no callback anymore
                        callback && callback();
                    }
                }
            });

            this.dialog.show();
        }

        InsertFromMenuAction.prototype.init = function () {
            window.charsToBeInserted = [];

            this.csmenu = new goog.ui.PopupMenu();

            //overwrite the handleBlur function to prevent the popup from closing after inserting a character
            this.csmenu.handleBlur = function () {
            };
            // this.csmenu.attach(document.querySelector('[name=insertfrommenu]'), goog.positioning.Corner.BOTTOM_START);

            var moreSymbols = new goog.ui.MenuItem('More symbols...');
            // moreSymbols.setEnabled(false);
            this.csmenu.addChild(moreSymbols, true);

            // todo move the dialog action performed
            var charPickerDialog = new InsertFromMenuAction(this.editor);
            goog.events.listen(moreSymbols, goog.ui.Component.EventType.ACTION, //goog.bind(displayDialog, this));
                goog.bind(charPickerDialog.displayDialog, charPickerDialog));

            this.csmenu.render(document.body);

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
                    //console.log(e.target);
                    //char-select-this-button
                    if (goog.dom.classlist.contains(e.target, 'goog-flat-button')) {
                        editor.getActionsManager().invokeOperation(
                            'ro.sync.ecss.extensions.commons.operations.InsertOrReplaceFragmentOperation', {
                                fragment: e.target.innerHTML
                            },
                            //callback);
                            //goog.events.dispatchEvent('finishedInsertingCharacter')
                            function () {
                                var quickInsertChar = e.target.innerHTML;
                                //console.log('callback from invokeOperation', localStorage.getItem("recentlyUsedCharacters"));
                                if (localStorageUsable()) {
                                    /* if using the localStorage is possible, add the character to the START of the array - queue system */
                                    if (storedRecentChars()) {
                                        console.log(quickInsertChar);
                                        var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                                        characters.unshift(quickInsertChar);
                                        characters = removeDuplicates(characters);
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                                        //displayRecentCharacters();

                                    } else {
                                        console.log('characters not found in localstorage, creating...');
                                        //todo
                                        characters = [];
                                        characters.unshift(quickInsertChar);
                                        localStorage.setItem("recentlyUsedCharacters", JSON.stringify(characters));
                                        //displayRecentCharacters();
                                        console.log('finally', characters);
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
        addToDitaToolbar(editor);

        function addToDitaToolbar(editor) {
            goog.events.listen(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function (e) {
                var actionsConfig = e.actionsConfiguration;

                var ditaToolbar = null;
                if (actionsConfig.toolbars) {
                    for (var i = 0; i < actionsConfig.toolbars.length; i++) {
                        var toolbar = actionsConfig.toolbars[i];
                        if (toolbar.name == "DITA") {
                            ditaToolbar = toolbar;
                        }
                    }
                }

                if (ditaToolbar) {
                    ditaToolbar.children.push({
                            id: 'insertfrommenu',
                            type: "action"
                        });
                    setTimeout(function () {
                        insertFromMenu.init();
                    }, 0)
                }
            });
        };

        sync.util.loadCSSFile("../plugin-resources/char-picker/charpicker.css");
        sync.util.loadCSSFile("../plugin-resources/char-picker/common.css");
    })
})();