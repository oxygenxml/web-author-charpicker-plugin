package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.net.Proxy;
import java.net.URL;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.Map;

import ro.sync.ecss.extensions.api.webapp.plugin.URLStreamHandlerWithContext;

public class GithubUrlStreamHandler extends URLStreamHandlerWithContext {
  
  /**
   * A map of <sessionId, access_token>
   * Used to hold the access_token for each session
   * */
  public static final Map<String, String> accessTokens = new HashMap<String, String>();
  
  @Override
  protected URLConnection openConnectionInContext(String contextId, URL url,
      Proxy proxy) throws IOException {
    
    String urlPathPart = url.getPath();
    
    // The github url path structure is: /$owner/$repo/&branch/$path
    String[] urlComponents = urlPathPart.split("/");
    
    String owner = urlComponents[1];
    String repo = urlComponents[2];
    String branch = urlComponents[3];
    String path = "";
    
    for (int i = 4; i < urlComponents.length; ++i) {
      path += "/" + urlComponents[i];
    }
    
    String githubApiUrlString = "https://api.github.com/repos/" + 
                                owner + "/" + repo + "/contents" + path + "?ref=" + branch;
    URL apiUrl = new URL(githubApiUrlString);
    
    String accessToken = accessTokens.get(contextId);
    return new GithubUrlConnection(apiUrl.openConnection(), accessToken);
  }
}
