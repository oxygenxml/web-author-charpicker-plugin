package com.oxygenxml.sdksamples.github;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import ro.sync.exml.plugin.Plugin;
import ro.sync.exml.plugin.PluginDescriptor;

/**
 * Plugin that represents the GitHub connector for oXygen XML WebApp.
 */
public class GitHubPlugin extends Plugin {
  /**
   * A map of <sessionId, access_token>
   * Used to hold the access_token for each session.
   **/
  public static final Map<String, String> accessTokens = new HashMap<String, String>();
  
  /**
   * The base directory of the plugin.
   */
  private static File baseDir;

  /**
   * Constructor.
   * 
   * @param descriptor The plugin descriptor.
   */
  public GitHubPlugin(PluginDescriptor descriptor) {
    super(descriptor);
    baseDir = descriptor.getBaseDir();
  }
  
  /**
   * @return The base directory of the plugin.
   */
  public static File getBaseDir() {
    return baseDir;
  }
}
