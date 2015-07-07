package com.oxygenxml.sdksamples.github;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;

import ro.sync.ecss.extensions.api.webapp.plugin.WebappServletPluginExtension;

/**
 * Servlet used to for the GitHub OAuth flow. 
 */
public class GitHubStaticContentServlet extends WebappServletPluginExtension{
  /**
   * Serves files from the plugin's base directory.
   */
  @Override
  public void doGet(HttpServletRequest httpRequest, HttpServletResponse httpResponse) throws IOException {
    String pathInfo = httpRequest.getPathInfo();
    String basePath = "/" + getPath();
    String resourcePath = pathInfo.substring(basePath.length());
    
    
    File resourceFile = new File(GitHubPlugin.getBaseDir(), resourcePath);
    // Serve SVG files with the right mime type.
    if (resourceFile.getName().endsWith(".svg")) {
      httpResponse.addHeader("Content-Type", "image/svg+xml");
    }
    if (resourceFile.getName().endsWith(".css")) {
      httpResponse.addHeader("Content-Type", "text/css");
    }

    FileInputStream inputStream = null;
    try {
      try {
        inputStream = new FileInputStream(resourceFile);
        IOUtils.copy(inputStream, httpResponse.getOutputStream());
      } catch (FileNotFoundException e1) {
        httpResponse.sendError(HttpServletResponse.SC_NOT_FOUND, e1.getMessage());
      } catch (IOException e) {
        httpResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
      }
    } finally {
      if (inputStream != null) {
        inputStream.close();
      }
    }
  }

  /**
   * The path at which the servlet is deployed.
   */
  @Override
  public String getPath() {
    return "github-resources";
  }
}
