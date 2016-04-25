(function () {
    goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {

        //var url = e.options.url;
        //console.log(sync.util.Url(url).getDomain());

        //quickly change urls that have the plugin name hardcoded
        var pluginNameForResources = 'char-picker';

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
        };
        var capitalizeWords = function(text) {
            var splitText = text.toLowerCase().split(' ');
            for(var i=0; i<splitText.length; i++) {
                //console.log(splitText[i].charAt[0]);
                splitText[i] = splitText[i].substr(0,1).toUpperCase() + splitText[i].substring(1);
            }
            return splitText.join(' ');
        }
        var displayRecentCharacters = function () {
            var defaultRecentCharacters = ["\u20ac", "\u00a3", "\u00a5", "\u00a2", "\u00a9", "\u00ae", "\u2122", "\u03b1", "\u03b2", "\u03c0", "\u03bc",
                "\u03a3", "\u03a9", "\u2264", "\u2265", "\u2260", "\u221e", "\u00b1", "\u00f7", "\u00d7", "\u21d2"]
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
            var maxChars = 21;
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
                        'class': 'goog-inline-block goog-flat-button char-select-button'
                    },
                    characters[i]));
            }
        }
        var updateCharPreview = function(e) {
            var symbol = e.target.innerHTML;
            var symbolCode = e.target.getAttribute('data-symbol-hexcode');
            var symbolName = e.target.getAttribute('data-symbol-name')
            document.querySelector('#previewCharacterDetails').innerHTML = '<div id="previewSymbol">' + symbol +
                '</div><div id="previewSymbolName">' + symbolName + ' <span style="white-space: nowrap; vertical-align: top">(' + symbolCode + ')</span></div>';
        };

        var InsertFromMenuAction = function (editor) {
            this.editor = editor;
            this.dialog = workspace.createDialog();
            this.dialog.setTitle('Insert Special Characters');
        };
        InsertFromMenuAction.prototype = new sync.actions.AbstractAction('');
        InsertFromMenuAction.prototype.getDisplayName = function () {
            return 'insert from menu';
        };
        /*githubOpenAction.setLargeIcon(
            '../plugin-resources/github-static/Github70' + (sync.util.getHdpiFactor() > 1 ? '@2x' : '') + '.png');*/
        //var myIconUrl = sync.util.computeHdpiIcon('../plugin-resources/' + pluginNameForResources + '/InsertFromCharactersMap24' + (sync.util.getHdpiFactor() > 1 ? '@2x' : '') + '.png');
        var myIconUrl = sync.util.computeHdpiIcon('../plugin-resources/' + pluginNameForResources + '/InsertFromCharactersMap24.png');
        InsertFromMenuAction.prototype.getLargeIcon = function () {
            return myIconUrl;
        };
        InsertFromMenuAction.prototype.displayDialog = function () {
            window.charsToBeInserted = [];
            // if dialog has not been opened yet, load it
            if(document.querySelector('#charpickeriframe') === null) {
                var tabContainer = goog.dom.createDom('div', {class: 'tabsContainer'});
                tabContainer.innerHTML = '<ul><li><input type="radio" name="tabsContainer-0" id="tabsContainer-0-0" checked="checked" />' +
                    '<label for="tabsContainer-0-0">By name</label><div id="charpicker-search-by-name"></div></li>' +
                    '<li><input type="radio" name="tabsContainer-0" id="tabsContainer-0-1" />' +
                    '<label for="tabsContainer-0-1">By categories or hex name</label><div id="charpicker-advanced"></div></li></ul>';

                var charPickerIframe = goog.dom.createDom('iframe', {
                    'id': 'charpickeriframe',
                    'src': '../plugin-resources/' + pluginNameForResources + '/charpicker.html'
                    //'src': '../plugin-resources/closure/charpicker.html'
                });
                this.dialog.getElement().id = 'charPicker';
                this.dialog.getElement().appendChild(tabContainer);


                //var searchByNameInput = goog.dom.createDom('in')
                var searchByNameContainer = document.getElementById("charpicker-search-by-name");
                searchByNameContainer.innerHTML = '<div style="display:inline-block; line-height: 1.2em;">Name of character: <br> <input type="text" name="searchName" id="searchName"></div><button id="searchNameButton" class="goog-char-picker-okbutton">search</button>'
                    + '<div id="foundByNameList"></div>';

                var previewCharacterDetails = goog.dom.createDom('div', {'id': 'previewCharacterDetails'});
                document.getElementById('charpicker-search-by-name').appendChild(previewCharacterDetails);

                goog.events.listen(document.querySelector('#foundByNameList'),
                    goog.events.EventType.MOUSEOVER,
                    function (e){
                        console.log(e);
                        if(e.target.id !== 'foundByNameList'){
                            updateCharPreview(e);
                        }
                    }
                );
                goog.events.listen(document.querySelector('#foundByNameList'),
                    goog.events.EventType.CLICK,
                    function (e){
                        console.log(e);
                        if(e.target.id !== 'foundByNameList'){
                            updateCharPreview(e);
                            var symbol = e.target.innerHTML;
                            charsToBeInserted.push(symbol);
                            document.getElementById('special_characters').value += symbol;
                        }
                    }
                );


                //goog.events.listen(moreSymbols, goog.ui.Component.EventType.ACTION, goog.bind(charPickerDialog.displayDialog, charPickerDialog));
                goog.require('goog.net.XhrIo');
                var executeQuery = function(query) {
                    //var url = "https://i18n-cloud.appspot.com/csearch";
                    var url = "http://localhost:8081/oxygen-sdk-sample-webapp/plugins-dispatcher/charpicker-plugin" + "?q=" + encodeURIComponent(query);
                    console.log('sending request');
                    document.getElementById("foundByNameList").innerHTML = '';
                    goog.net.XhrIo.send(url, function(e){
                        console.log(e);
                        var xhr = e.target;
                        var obj = xhr.getResponseJson();

                        for(var i in obj) {
                            var foundByNameItem = goog.dom.createDom('div', {'class': 'characterListSymbol', 'data-symbol-name': capitalizeWords(obj[i]), 'data-symbol-hexcode': i});
                            var decimalCode = parseInt(i, 16);
                            foundByNameItem.innerHTML = String.fromCodePoint(decimalCode);
                            document.getElementById("foundByNameList").appendChild(foundByNameItem);
                        }

                        //console.log(obj);
                    }, "GET");
                    //}, "POST", "q=" + encodeURIComponent(query));
                };
                goog.events.listen(document.getElementById("searchNameButton"), goog.events.EventType.CLICK, function(){
                    var query = document.getElementById("searchName").value;
                    executeQuery(query);

                });

                // when the user is searching for character by name, enter triggers submit query instead of closing the dialog
                goog.events.listen(document.querySelector('#searchName'), goog.events.EventType.KEYDOWN, function(e){
                    console.log('pressing');
                        if(e.keyCode === 13) {
                            e.preventDefault();
                            var query = document.getElementById("searchName").value;
                            executeQuery(query);
                        }
                    }
                );

                //todo: make separate function for the query, rename query

                document.querySelector('#charpicker-advanced').appendChild(charPickerIframe);

                var div = goog.dom.createDom('div');
                div.innerHTML = '<span>Insert characters:</span>' +
                '<input type="text" name="charsToBeInserted" id="special_characters" onFocus="this.setSelectionRange(0, this.value.length)" readonly/>' +
                '<button id="removeLastChar" class="goog-button goog-char-picker-okbutton" title="Remove last character" value=""></button>';

                this.dialog.getElement().appendChild(div);

                var textarea = document.getElementById('special_characters');
                textarea.scrollTop = textarea.scrollHeight;
                goog.events.listen(this.dialog.getElement().querySelector('#removeLastChar'), goog.events.EventType.CLICK, function(){
                    var preview = document.getElementById('special_characters');
                    preview.value = '';
                    charsToBeInserted.pop();
                    for(var i=0;i<charsToBeInserted.length;i++){
                        preview.value += charsToBeInserted[i];
                    }
                });

            }
            // if dialog has been populated already just reset the textboxes
            else {
                this.dialog.getElement().querySelector('#special_characters').value = '';
                this.dialog.getElement().querySelector('#searchName').value = '';
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
                    console.log('key' + key);
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
                                if (localStorageUsable()) {
                                    /* if using the localStorage is possible, add the text to the START of the array - queue system */
                                    if (storedRecentChars()) {
                                        var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                                        characters = (dialogInsertChars.reverse()).concat(characters);
                                        characters = removeDuplicates(characters);
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
        }

        InsertFromMenuAction.prototype.init = function () {
            window.charsToBeInserted = [];

            this.csmenu = new goog.ui.PopupMenu();

            //overwrite the handleBlur function to prevent the popup from closing after inserting a character
            this.csmenu.handleBlur = function () {
            };

            var moreSymbols = new goog.ui.MenuItem('More symbols...');
            this.csmenu.addChild(moreSymbols, true);
            moreSymbols.setId('moreSymbolsButton');

            var charPickerDialog = new InsertFromMenuAction(this.editor);
            goog.events.listen(moreSymbols, goog.ui.Component.EventType.ACTION, goog.bind(charPickerDialog.displayDialog, charPickerDialog));

            this.csmenu.render(document.body);
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
                                fragment: e.target.innerHTML
                            },
                            function () {
                                var quickInsertChar = e.target.innerHTML;
                                if (localStorageUsable()) {
                                    /* if using the localStorage is possible, add the character to the START of the array - queue system */
                                    if (storedRecentChars()) {
                                        var characters = JSON.parse(localStorage.getItem("recentlyUsedCharacters"));
                                        characters.unshift(quickInsertChar);
                                        characters = removeDuplicates(characters);
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
                    }, 0)
                }
            });
        };
        sync.util.loadCSSFile("../plugin-resources/" + pluginNameForResources + "/plugin.css");
    })
})();