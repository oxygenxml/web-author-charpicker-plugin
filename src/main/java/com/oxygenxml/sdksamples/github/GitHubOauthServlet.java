package com.oxygenxml.sdksamples.github;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

/**
 * Servlet used to for the GitHub OAuth flow. 
 */
@SuppressWarnings("serial")
public class GitHubOauthServlet extends HttpServlet implements WebappServletPluginExtension{
  @Override
  public void doPost(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws ServletException, IOException {
    super.doPost(httpRequest, httpResponse);
  }

  @Override
  public void doGet(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws ServletException, IOException {
    super.doGet(httpRequest, httpResponse);
  }

  @Override
  public String getPath() {
    return "github-oauth";
  }
}
