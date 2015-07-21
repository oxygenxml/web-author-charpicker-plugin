package com.oxygenxml.sdksamples.github;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.HashMap;

import org.jboss.resteasy.util.Base64;

import ro.sync.ecss.extensions.api.webapp.plugin.FilterURLConnection;

public class GithubUrlConnection extends FilterURLConnection {

  /**
   * Constructor
   * @param delegateConnection The underlying url connection
   * @param accessToken The github access token
   */
  public GithubUrlConnection(URLConnection delegateConnection, String accessToken) {
    super(delegateConnection);
    delegateConnection.setRequestProperty("Authorization", "token " + accessToken);
  }
  
  @Override
  public InputStream getInputStream() throws IOException {
    HashMap<String, Object> result = GithubUtil.parseJSON(delegateConnection.getInputStream());
    
    String base64Content = (String) result.get("content");
    byte[] decodedContent = Base64.decode(base64Content);
    
    return new ByteArrayInputStream(decodedContent);
  }
  
}
