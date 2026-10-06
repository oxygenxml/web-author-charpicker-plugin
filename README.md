# webapp-charpicker-plugin
[![Build Status](https://api.travis-ci.org/oxygenxml/webapp-charpicker-plugin.svg)](https://travis-ci.org/oxygenxml/webapp-charpicker-plugin)

A plugin for Oxygen XML WebAuthor that adds support for inserting special UTF-8 characters

## Installation
To install this plugin, download one of the releases ([link](https://www.oxygenxml.com/maven/com/oxygenxml/web-author-charpicker-plugin/)) and [upload it in your Web Author deployment](https://www.oxygenxml.com/doc/ug-webauthor/topics/webapp-configure-plugins.html).

## Use
Once installed, you should find the ![charpicker button](/resources/InsertFromCharactersMap24.png) button in the framework toolbar. Clicking it presents a grid with 21 recently used characters.
Initially, the grid contains a set of commonly used characters.

Clicking on the **More symbols...** button will open a dialog box where you can search for special characters in one of the following ways:

- by partial or full name (ex: "left arrow")
- by categories and subcategories
- by their hex value

## Configuration
From the plugin configuration page (found in the "Plugins" section in Web Author's administration page), you can:
- Use the **Remove categories** field to remove one or more categories shown in the "By categories" tab, using the English names as listed on the configuration page (you can also use the * character to completely remove the "By categories" view).
- Use the **Default recently used characters** field to set the default characters shown in the recently used characters grid.

## Translating character names
The **By name** search uses the English Unicode character names. To search in another language, add a
`<lang>_unicodechars.properties` file (for example `de_unicodechars.properties`) to the plugin's `lib` folder.
Supported languages: `fr`, `de`, `ja`, `nl`, `zh`. Characters missing from the translated file are found by their
English name.

Each line maps a code point, as 5 uppercase hex digits, to a name:

```
000E9=Lettre minuscule latine e accent aigu
```

Save the file as **UTF-8**, without a byte order mark.

Copyright and License
---------------------
Copyright 2018 Syncro Soft SRL.

This project is licensed under [Apache License 2.0](LICENSE)
