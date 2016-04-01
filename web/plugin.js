(function () {
    goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function (e) {
        var url = e.options.url;
        // If the URL starts with http:, use thw webdav protocol handler.
        e.options.url = url;
        
        
        InsertSpecialCharsAction = function (editor) {
            this.editor = editor;
            this.dialog = workspace.createDialog();
            this.dialog.setTitle('Insert Special Chars');
            this.dialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.OK_CANCEL);
        };
        InsertSpecialCharsAction.prototype = new sync.actions.AbstractAction('');
        
        /** The display name of the action */
        InsertSpecialCharsAction.prototype.getDisplayName = function () {
            return 'Show special chars';
        };
        //var myIconUrl = sync.util.computeHdpiIcon('../plugin-resources/webdav/download.jpg');
        //var myIconUrl = sync.util.computeHdpiIcon('../plugin-resources/charpicker/InsertFromCharactersMap24@2x.png');
        var myIconUrl = sync.util.computeHdpiIcon('../plugin-resources/char-picker/InsertFromCharactersMap24.png');
        InsertSpecialCharsAction.prototype.getLargeIcon = function () {
            return myIconUrl;
        };
        /** The actual action execution. */
        InsertSpecialCharsAction.prototype.actionPerformed = function (callback) {
            console.log('action');
            //console.log(this.editor.getSelectionManager().getSelection());

            this.dialog.getElement().innerHTML = '<div>Insert character:<span id="pp_value" style="padding-left:10px;"></span></div>';
//                //this.dialog.getElement().appendChild('<div style="background-color: red;">testing</div>');
            
            var charPickerIframe = goog.dom.createDom('iframe', {'id' : 'charpickeriframe','style': 'width:400px;height:200px;', 'src':'../plugin-resources/char-picker/charpicker.html'});
            this.dialog.getElement().appendChild(charPickerIframe);
            
            
            console.log(document.querySelector('button[name=ok]'));                
            
            var charmapContainer = goog.dom.createDom('div', {'id':'mycharmap'});
            
            
            
            
            var buttonOK = this.dialog.getElement().querySelector('button[name=ok]');
            goog.events.listen(this.dialog.getElement(), goog.ui.Dialog.EventType.SELECT, function(){
                console.log("select is handled HERE");
            });
            this.dialog.show();
        };
        
        var editor = e.editor;
        editor.getActionsManager().registerAction('special', new InsertSpecialCharsAction(editor));
        addToDitaToolbar(editor, 'special');
        
        function addToDitaToolbar(editor, actionId) {
            console.log("adding stuff to dita");
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
                        id: actionId,
                        type: "action"
                    });
                }
            });
        };
        
        sync.util.loadCSSFile("../plugin-resources/char-picker/charpicker.css");
    })
})();