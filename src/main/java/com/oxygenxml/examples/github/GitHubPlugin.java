package com.oxygenxml.examples.github;

import java.io.File;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;

import ro.sync.exml.plugin.Plugin;
import ro.sync.exml.plugin.PluginDescriptor;

/**
 * Plugin that represents the GitHub connector for oXygen XML Web Author.
 */
public class GitHubPlugin extends Plugin {
  /**
   * A map of <sessionId, access_token>
   * Used to hold the access_token for each session.
   **/
  public static final Cache<String, String> accessTokens = CacheBuilder.newBuilder()
      .concurrencyLevel(10)
      .maximumSize(10000)
      .build();
  
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
