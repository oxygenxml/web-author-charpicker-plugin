package com.oxygenxml.sdksamples.github;

import java.io.File;

import ro.sync.exml.plugin.Plugin;
import ro.sync.exml.plugin.PluginDescriptor;

/**
 * Plugin that represents the GitHub connector for oXygen XML WebApp.
 */
public class GitHubPlugin extends Plugin {
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
