package com.oxygenxml.sdksamples.github;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * This is a listener class which manages the references to sessionIds.
 * 
 * The method sessionDestroyed is called when a session is destroyed to remove the
 * destroyed sessions accessToken from the accessTokens map to avoid leaking memory.
 * 
 * @author gabriel_titerlea
 *
 */
public class HttpSessionObserver implements HttpSessionListener {
  @Override
  public void sessionCreated(HttpSessionEvent session) {
  }

  @Override
  public void sessionDestroyed(HttpSessionEvent session) {
    GitHubPlugin.accessTokens.remove(session.getSession().getId());
  }

}
