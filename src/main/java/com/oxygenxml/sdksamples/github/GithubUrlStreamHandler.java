package com.oxygenxml.sdksamples.github;

import java.io.IOException;
import java.net.Proxy;
import java.net.URL;
import java.net.URLConnection;

import ro.sync.ecss.extensions.api.webapp.plugin.URLStreamHandlerWithContext;

/**
 * Used for opening proper GithubUrlConnections, making sure they have an access token
 * 
 * @author gabriel_titerlea
 *
 */
public class GithubUrlStreamHandler extends URLStreamHandlerWithContext {
  
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
    
    // To increase the rate limit of the github api we must send the client secret and client id with each request
    if (GitHubOauthServlet.clientId != null && GitHubOauthServlet.clientSecret != null) {
      githubApiUrlString += "&client_id=" + GitHubOauthServlet.clientId + "&client_secret=" + GitHubOauthServlet.clientSecret;
    }
    
    URL apiUrl = new URL(githubApiUrlString);
    
    String accessToken = GitHubPlugin.accessTokens.get(contextId);
    return new GithubUrlConnection(apiUrl.openConnection(), accessToken, urlPathPart);
  }
}
