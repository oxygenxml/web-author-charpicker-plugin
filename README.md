# webapp-charpicker-plugin
[![Build Status](https://api.travis-ci.org/oxygenxml/webapp-charpicker-plugin.svg)](https://travis-ci.org/oxygenxml/webapp-charpicker-plugin)

A plugin for Oxygen XML WebAuthor that adds support for inserting special UTF-8 characters

## Installation
To install this plugin, download one of the releases ([link](https://www.oxygenxml.com/maven/com/oxygenxml/web-author-charpicker-plugin/)) and [upload it in your Web Author deployment](https://www.oxygenxml.com/doc/ug-webauthor/topics/webapp-configure-plugins.html).

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

This project is licensed under [Apache License 2.0](LICENSE)
