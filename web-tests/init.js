// Init Web Author's environment before executing plugin's JS files.
if (!window.sync) {
  console.warn("First run 'mvn generate-resources'");
}
workspace = new window.sync.Workspace();