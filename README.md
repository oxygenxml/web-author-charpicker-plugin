# webapp-charpicker-plugin
[![Build Status](https://api.travis-ci.org/oxygenxml/webapp-charpicker-plugin.svg)](https://travis-ci.org/oxygenxml/webapp-charpicker-plugin)

A plugin for Oxygen XML WebAuthor that adds support for inserting special UTF-8 characters

## Build

You should have a java JDK (6 or later) and maven. Then run the following command:
```
mvn package
```

## Deploy

You can add the plugin to an oXygen XML Web Author server by uploading the .jar file from the **target** folder. The complete procedure can be found in the [User Guide](http://oxygenxml.com/doc/versions/17.1.1/ug-webauthor/#topics/webapp-configure-plugins.html).

## Use
You should find the ![charpicker button](/resources/InsertFromCharactersMap24.png) button in the framework toolbar. Clicking on it should present a grid with 21 recently used characters.
Initially the grid contains a set of commonly used characters.

Clicking on the **More symbols...** button will open a dialog where you can search for special characters in one of the following ways:

- by partial or full name (ex: "left arrow")
- by categories and subcategories
- by their hex value.

## Configuration
From the plugin configuration page you can:
- remove one or more categories shown in the "By categories" tab
- set the default characters shown in the recently used characters grid

Copyright and License
---------------------
Copyright 2018 Syncro Soft SRL.

This project is licensed under [Apache License 2.0](https://github.com/oxygenxml/web-author-charpicker-plugin/blob/master/LICENSE)
