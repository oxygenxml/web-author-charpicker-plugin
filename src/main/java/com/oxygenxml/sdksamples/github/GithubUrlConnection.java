package com.oxygenxml.sdksamples.github;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.jboss.resteasy.util.Base64;

import ro.sync.ecss.extensions.api.webapp.WebappMessage;
import ro.sync.ecss.extensions.api.webapp.plugin.FilterURLConnection;
import ro.sync.ecss.extensions.api.webapp.plugin.UserActionRequiredException;
import ro.sync.net.protocol.FileBrowsingConnection;
import ro.sync.net.protocol.FolderEntryDescriptor;
import ro.sync.util.URLUtil;

/**
 * Used to handle requests for urls like: github://method/params.
 * 
 * @author gabriel_titerlea
 *
 */
public class GithubUrlConnection extends FilterURLConnection implements FileBrowsingConnection {

  /**
   * The path of the opened url
   */
  private String urlPathPart;
  
  /**
   * Constructor
   * @param delegateConnection The underlying url connection
   * @param accessToken The github access token
   */
  public GithubUrlConnection(URLConnection delegateConnection, String accessToken, String urlPathPart) {
    super(delegateConnection);
    if (accessToken != null) {
      delegateConnection.setRequestProperty("Authorization", "token " + accessToken);
    }
    this.urlPathPart = urlPathPart;
  }
  
  @Override
  public InputStream getInputStream() throws IOException {
    String githubJsonResult;
    try {
      // The response from github comes in a json like: // {"content":"BASE64ecnodedContent",otherProps}
      githubJsonResult = GithubUtil.inputStreamToString(delegateConnection.getInputStream());
    } catch (IOException e) {
      throw new IOException("404 Not Found for: " + urlPathPart);
    }
    HashMap<String, Object> result = GithubUtil.parseJSON(githubJsonResult);

    String base64Content = (String) result.get("content");
    byte[] decodedContent = Base64.decode(base64Content);

    return new ByteArrayInputStream(decodedContent);

  }
  
  @Override
  public List<FolderEntryDescriptor> listFolder() throws IOException {
    List<FolderEntryDescriptor> filesList = new ArrayList<FolderEntryDescriptor>();
    try {
      String githubJsonResult = GithubUtil
          .inputStreamToString(delegateConnection.getInputStream());

      // If this is a Json array:
      // [{content:'content'},{content:'content'},{content:'content'}]
      if (githubJsonResult.charAt(0) == '[') {
        List<GithubApiResult> githubResults = GithubUtil
            .parseGithubListResult(githubJsonResult);

        for (GithubApiResult result : githubResults) {
          // Add a '/' when the file is a directory because this is how upstream
          // identifies directories
          String dirChar = "";
          if (result.type.equals("dir")) {
            dirChar = "/";
          }

          filesList.add(new FolderEntryDescriptor(URLUtil
              .encodeURIComponent(result.name) + dirChar));
        }
      } else {
        // The result is a file and its content is Base64 encoded in the content
        // property
        GithubApiResult githubResult = GithubUtil
            .parseGithubResult(githubJsonResult);

        byte[] decodedContent = Base64.decode(githubResult.content);
        filesList.add(new FolderEntryDescriptor(new String(decodedContent)));
      }
    } catch (IOException e) {
      if (e.getMessage().startsWith("401") || e.getMessage().startsWith("403 Forbidden")) {
        // if the user is not authorized
        throw new UserActionRequiredException(new WebappMessage(
            WebappMessage.MESSAGE_TYPE_CUSTOM, "Authentication required",
            "Authentication required", true));
      } else {
        throw e;
      }
    }
    return filesList;
  }
  
}
