# webapp-charpicker-plugin
[![Build Status](https://api.travis-ci.org/oxygenxml/webapp-charpicker-plugin.svg)](https://travis-ci.org/oxygenxml/webapp-charpicker-plugin)

A plugin for oXygen XML WebApp that adds support for inserting special UTF-8 characters

## Install

You can download the release suitable for your oXygen XML Web Author server and install it using the **Administration Page**. The complete procedure can be found in the [User Guide](http://oxygenxml.com/doc/versions/18.1.0/ug-webauthor/#topics/webapp-configure-plugins.html).

## Use
You should find the ![charpicker button](/resources/InsertFromCharactersMap24.png) button in the framework toolbar. Clicking on it should present a grid with 21 recently used characters.
Initially the grid contains a set of commonly used characters.

Clicking on the **More symbols...** button will open a dialog where you can search for special characters in one of the following ways:

- by partial or full name (ex: "left arrow")
- by categories and subcategories
- by their hex value.

## Build

You should have a java JDK (6 or later) and maven. Then run the following command:
```
mvn package
```
The plugin to be added to the oXygen XML Web Author server is the .jar file from the **target** folder. 
