#!/usr/bin/env node
'use strict';

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');
var util = require('util');

var UCD_BASE_URL = 'https://www.unicode.org/Public/';
var DEFAULT_OUTPUT = path.join(__dirname, '..', 'src', 'main', 'resources', 'en_unicodechars.properties');
var THIRD_PARTY_COMPONENTS = path.join(__dirname, '..', 'third-party-components.xml');
var USER_AGENT = 'webapp-charpicker-plugin unicodechars generator';
var KEY_HEX_DIGITS = 5;

function printUsage() {
  console.log('Usage: node tools/generate-unicodechars.js --version <x.y.z> [options]');
  console.log('');
  console.log('Downloads UnicodeData.txt of the given Unicode version, writes en_unicodechars.properties');
  console.log('and updates the Unicode Character Database entry in third-party-components.xml.');
  console.log('');
  console.log('Options:');
  console.log('  --version <x.y.z> Unicode version to download, e.g. 18.0.0');
  console.log('  --input <file>    Read UnicodeData.txt from a local file instead of downloading');
  console.log('  --url <url>       UnicodeData.txt URL, instead of the one derived from --version');
  console.log('  --output <file>   Output properties file (default: src/main/resources/en_unicodechars.properties)');
  console.log('  --help            Show this help');
}

function parseArgs(argv) {
  var options = util.parseArgs({
    args: argv,
    options: {
      input: { type: 'string' },
      version: { type: 'string' },
      url: { type: 'string' },
      output: { type: 'string', default: DEFAULT_OUTPUT },
      help: { type: 'boolean', short: 'h' }
    }
  }).values;

  if (options.help) {
    printUsage();
    process.exit(0);
  }
  // Pinned rather than UCD/latest/, which moves to each new Unicode release; see tools/README.md.
  if (!options.version && !options.input && !options.url) {
    throw new Error('--version is required, e.g. --version 18.0.0');
  }
  return options;
}

function unicodeDataUrlFor(version) {
  return UCD_BASE_URL + version + '/ucd/UnicodeData.txt';
}

// curl rather than Node's https because it honors HTTPS_PROXY and the system certificate store.
function download(resourceUrl) {
  return childProcess.execFileSync('curl', [
    '--location',
    '--fail',
    '--silent',
    '--show-error',
    '--max-time', '60',
    '--user-agent', USER_AGENT,
    resourceUrl
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

function readUnicodeData(options) {
  if (options.input) {
    var inputPath = path.resolve(options.input);
    return { text: fs.readFileSync(inputPath, 'utf8'), label: inputPath, version: options.version };
  }
  var unicodeDataUrl = options.url || unicodeDataUrlFor(options.version);
  console.log('Downloading ' + unicodeDataUrl);
  return {
    text: download(unicodeDataUrl),
    label: unicodeDataUrl,
    version: options.version || detectUnicodeVersion(unicodeDataUrl)
  };
}

function detectUnicodeVersion(unicodeDataUrl) {
  var readmeUrl = unicodeDataUrl.replace(/UnicodeData\.txt$/i, 'ReadMe.txt');
  try {
    return parseUnicodeVersion(download(readmeUrl));
  } catch (err) {
    console.warn('Could not read Unicode version from ' + readmeUrl + ': ' + err.message);
    return null;
  }
}

function parseUnicodeVersion(readmeText) {
  var match = readmeText.match(/Version\s+(\d+\.\d+\.\d+)/) ||
      readmeText.match(/Unicode(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function toTitleCase(name) {
  return name.split(' ').map(function (word) {
    if (!word) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function parseUnicodeData(text) {
  var entries = text.split(/\r?\n/).map(parseUnicodeDataLine).filter(Boolean);
  entries.sort(function (a, b) {
    return a.codePoint - b.codePoint;
  });
  return entries;
}

function parseUnicodeDataLine(line) {
  var fields = line.split(';');
  var name = characterName(fields);
  var codePoint = parseInt(fields[0], 16);
  if (!name || isNaN(codePoint)) {
    return null;
  }
  return {
    codePoint: codePoint,
    key: codePoint.toString(16).toUpperCase().padStart(KEY_HEX_DIGITS, '0'),
    value: toTitleCase(name)
  };
}

// Null for entries without a name of their own, e.g. the <CJK Ideograph, First> range markers.
function characterName(fields) {
  var name = fields[1] || '';
  if (name === '<control>') {
    return (fields[10] || '').trim() || null;
  }
  return name && name.charAt(0) !== '<' ? name : null;
}

function escapePropertiesValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/^ /, '\\ ');
}

function formatProperties(entries, headerLines) {
  var entryLines = entries.map(function (entry) {
    return entry.key + '=' + escapePropertiesValue(entry.value);
  });
  return headerLines.concat(entryLines, ['']).join('\n');
}

function formatDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function propertiesHeader(source, now) {
  var lines = [
    '# Generated from UnicodeData.txt',
    '# Source: ' + source.label
  ];
  if (source.version) {
    lines.push('# Unicode version: ' + source.version);
  }
  lines.push('# Date: ' + formatDate(now));
  // The Unicode License v3 requires its notice to accompany the derived data; full text is in third-party-components.xml.
  lines.push('# Copyright © 1991-' + now.getUTCFullYear() + ' Unicode, Inc.');
  lines.push('# Licensed under the Unicode License v3: https://www.unicode.org/license.txt');
  lines.push('#');
  return lines;
}

function main() {
  var options = parseArgs(process.argv.slice(2));
  var source = readUnicodeData(options);
  var entries = parseUnicodeData(source.text);
  if (entries.length === 0) {
    throw new Error('No named characters found in UnicodeData');
  }

  var now = new Date();
  var outputPath = path.resolve(options.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, formatProperties(entries, propertiesHeader(source, now)), 'utf8');
  console.log('Wrote ' + entries.length + ' characters to ' + outputPath);

  if (outputPath === DEFAULT_OUTPUT && source.version) {
    updateThirdPartyComponents(source.version, now.getUTCFullYear());
    console.log('Updated the Unicode Character Database entry in ' + THIRD_PARTY_COMPONENTS);
  }
}

function updateThirdPartyComponents(unicodeVersion, year) {
  var xml = fs.readFileSync(THIRD_PARTY_COMPONENTS, 'utf8');
  var componentPattern = /<component id="unicode-character-database@[\s\S]*?<\/component>/;
  if (!componentPattern.test(xml)) {
    throw new Error('No unicode-character-database component in ' + THIRD_PARTY_COMPONENTS);
  }
  xml = xml.replace(componentPattern, function (component) {
    return component
      .replace(/(id="unicode-character-database@)[^"]+/, '$1' + unicodeVersion)
      .replace(/<version>[^<]*<\/version>/, '<version>' + unicodeVersion + '</version>')
      .replace(/(Copyright © 1991-)\d{4}/, '$1' + year);
  });
  fs.writeFileSync(THIRD_PARTY_COMPONENTS, xml, 'utf8');
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
