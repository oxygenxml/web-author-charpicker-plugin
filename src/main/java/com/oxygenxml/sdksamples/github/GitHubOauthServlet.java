package com.oxygenxml.sdksamples.github;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

/**
 * Servlet used to for the GitHub OAuth flow. 
 */
public class GitHubOauthServlet extends WebappServletPluginExtension{
  @Override
  public String getPath() {
    return "github-oauth";
  }
}
