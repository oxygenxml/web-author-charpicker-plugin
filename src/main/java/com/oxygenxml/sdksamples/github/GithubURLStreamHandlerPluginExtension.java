package com.oxygenxml.sdksamples.github;

import java.net.URLStreamHandler;

import ro.sync.exml.plugin.urlstreamhandler.URLStreamHandlerPluginExtension;
import ro.sync.exml.workspace.api.Platform;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

public class GithubURLStreamHandlerPluginExtension implements URLStreamHandlerPluginExtension {

  @Override
  public URLStreamHandler getURLStreamHandler(String protocol) {
    
    boolean isWebapp = Platform.WEBAPP.equals(PluginWorkspaceProvider.getPluginWorkspace().getPlatform());
    URLStreamHandler handler = null;
    
    if (isWebapp && protocol.contains("github")) {
      handler = new GithubUrlStreamHandler();
    }
    
    return handler;
  }

}
