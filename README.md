# webapp-charpicker-plugin
[![Build Status](https://api.travis-ci.org/oxygenxml/webapp-charpicker-plugin.svg?branch=BRANCH_OXYGEN_RELEASE_18_0)](https://travis-ci.org/oxygenxml/webapp-charpicker-plugin)

A plugin for oXygen XML WebApp that adds support for inserting special UTF-8 characters

## Build

You should have NodeJS and npm installed. Then run the following command:
```
npm run package
```

## Deploy

You can add the plugin to an oXygen XML Web Author server by uploading the .zip file from the **target** folder. The complete procedure can be found in the [User Guide](http://oxygenxml.com/doc/versions/17.1.1/ug-webauthor/#topics/webapp-configure-plugins.html).

## Use
You should find the ![charpicker button](/resources/InsertFromCharactersMap24.png) button in the framework toolbar. Clicking on it should present a grid with 21 recently used characters.
Initially the grid contains a set of commonly used characters.

Clicking on the **More symbols...** button will open a dialog where you can search for special characters by categories and subcategories and where you can add characters from their hex value.
