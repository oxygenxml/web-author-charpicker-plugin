package com.oxygenxml.sdksamples.github;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.jboss.resteasy.util.Base64;

import ro.sync.ecss.extensions.api.webapp.plugin.FilterURLConnection;
import ro.sync.net.protocol.FileBrowsingConnection;

public class GithubUrlConnection extends FilterURLConnection implements FileBrowsingConnection {

  /**
   * Constructor
   * @param delegateConnection The underlying url connection
   * @param accessToken The github access token
   */
  public GithubUrlConnection(URLConnection delegateConnection, String accessToken) {
    super(delegateConnection);
    if (accessToken != null) {
      delegateConnection.setRequestProperty("Authorization", "token " + accessToken);
    }
  }
  
  @Override
  public InputStream getInputStream() throws IOException {
    // The response from github comes in a json like: {"content":"BASE64ecnodedContent",otherProps}
    String githubJsonResult = GithubUtil.inputStreamToString(delegateConnection.getInputStream());
    HashMap<String, Object> result = GithubUtil.parseJSON(githubJsonResult);
    
    String base64Content = (String) result.get("content");
    byte[] decodedContent = Base64.decode(base64Content);
    
    return new ByteArrayInputStream(decodedContent);
  }
  
  @Override
  public List<String> listFiles() throws IOException {
    List<String> filesList = new ArrayList<String>();
    
    String githubJsonResult = GithubUtil.inputStreamToString(delegateConnection.getInputStream());
    
    // If this is a Json array: [{content:'content'},{content:'content'},{content:'content'}]
    if (githubJsonResult.charAt(0) == '[') {
      List<GithubApiResult> githubResults = GithubUtil.parseGithubListResult(githubJsonResult);
    
      for (GithubApiResult result: githubResults) {
        // Add a '/' when the file is a directory because this is how upstream identifies directories
        String dirChar = "";
        if (result.type.equals("dir")) {
          dirChar = "/";
        }
        
        filesList.add(result.name + dirChar);
      }
    } else {
      // The result is a file and its content is Base64 encoded in the content property
      GithubApiResult githubResult = GithubUtil.parseGithubResult(githubJsonResult);
      
      byte[] decodedContent = Base64.decode(githubResult.content);
      filesList.add(new String(decodedContent));
    }
    
    return filesList;
  }
  
}
