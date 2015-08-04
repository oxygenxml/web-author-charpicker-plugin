package com.oxygenxml.sdksamples.github;

import java.net.URLStreamHandler;

import ro.sync.exml.plugin.urlstreamhandler.URLStreamHandlerPluginExtension;
import ro.sync.exml.workspace.api.Platform;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

/**
 * Used to open a proper UrlStreamHandler if the url is a gihtub url
 * 
 * @author gabriel_titerlea
 *
 */
public class GithubURLStreamHandlerPluginExtension implements URLStreamHandlerPluginExtension {

  @Override
  public URLStreamHandler getURLStreamHandler(String protocol) {
    
    boolean isWebapp = Platform.WEBAPP.equals(PluginWorkspaceProvider.getPluginWorkspace().getPlatform());
    URLStreamHandler handler = null;
    
    // If this is a url like: github://method/params
    if (isWebapp && protocol.contains("github")) {
      handler = new GithubUrlStreamHandler();
    }
    
    return handler;
  }

}
