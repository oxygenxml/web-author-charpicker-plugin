describe('CharPicker test', function() {

  it('should schedule insert character text', function () {

    var actionsExecutor = mockActionsExecutor();
    var editor = mockEditor(actionsExecutor);
    var action = new InsertFromMenuAction(editor);
    action.init();

    action.insertCharacters_("a");
    sinon.assert.calledOnce(actionsExecutor.executeAction);
  });

  function mockActionsExecutor() {
    return  sinon.createStubInstance(sync.actions.ActionsExecutor, {
      executeAction: sinon.stub(),
    });
  }

  function mockEditor(actionsExecutor) {
    var editingSupport =  sinon.createStubInstance(sync.support.AuthorEditingSupport)
    editingSupport.actionsExecutor = actionsExecutor;
    return sinon.createStubInstance(sync.Editor, {
      getEditingSupport: sinon.stub().returns(editingSupport),
    });
  }
});