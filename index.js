"use strict";

var base = require("@sembiance/xbase"),
	PEG = require("pegjs"),
	path = require("path"),
	unicodeUtil = require("@sembiance/xutil").unicode,
	fs = require("fs");

var MAX_TOKENS = 10;

var parser = PEG.buildParser(fs.readFileSync(path.join(__dirname, "grammar.pegjs"), {encoding:"utf8"}));

exports.search = search;
function search(index, query)
{
	return parser.parse(query, {index:index, unicodeToAscii : unicodeUtil.unicodeToAscii});
}


exports.buildIndex = buildIndex;
function buildIndex(items, options)
{
	options = options || {};

	var index = {all:[], numerical : Array.toArray(options.numerical || [])};

	items.forEach(function(item, i)
	{
		index.all.push(i);

		Object.keys(item).forEach(function(key)
		{
			processKey(index, item, i, key, options.maxTokens || MAX_TOKENS);
		});
	});

	index.numerical.forEach(function(numericalKey) { index[numericalKey]["_"] = index[numericalKey]["_"].sort(function(a, b) { return a-b; }); });

	return index;
}

function tokenizeText(text)
{
	return unicodeUtil.unicodeToAscii(text).toLowerCase().replaceAll("[\s/_-]", " ").strip("[^A-Za-z0-9 ]").split(" ").filterEmpty();
}

function processKey(index, item, idx, key, maxTokens)
{
	var value = item[key];

	if(Array.isArray(value))
	{
		value.forEach(function(value) { addToIndex(index, key, value, idx); });
	}
	else if(typeof value==="string")
	{
		var tokens = tokenizeText(value);
		var len = tokens.length;
		for(var z=1;z<=maxTokens;z++)
		{
			for(var i=0;(i+z)<=len;i++)
			{
				addToIndex(index, key, tokens.slice(i, (i+z)).join(" "), idx);
			}
		}
	}
	else if(typeof value==="number")
	{
		if(!index.numerical.contains(key))
			index.numerical.push(key);

		addToIndex(index, key, value, idx);
	}
	else
	{
		throw new Error("Un-handled type [" + typeof value + "] for key [" + key + "] with value: " + value);
	}
}

function addToIndex(index, key, value, i)
{
	if(typeof value==="string")
		value = unicodeUtil.unicodeToAscii(value).toLowerCase();

	if(!index.hasOwnProperty(key))
		index[key] = {_:[]};

	if(!index[key].hasOwnProperty(value))
		index[key][value] = [];

	if(!index[key][value].contains(i))
		index[key][value].push(i);

	if(index.numerical.contains(key))
	{
		var valueNum = +((""+value).replace(/[^0-9.]+/, ""));
		if(!index[key]["_"].contains(valueNum))
			index[key]["_"].push(valueNum);
	}
}
