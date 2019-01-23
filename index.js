"use strict";

const base = require("@sembiance/xbase"),
	PEG = require("pegjs"),
	path = require("path"),
	unicodeUtil = require("@sembiance/xutil").unicode,
	fs = require("fs");

const MAX_TOKENS = 10;

const parser = PEG.generate(fs.readFileSync(path.join(__dirname, "grammar.pegjs"), base.UTF8));

exports.search = search;
function search(index, query)
{
	return parser.parse(query, {index, unicodeToAscii : unicodeUtil.unicodeToAscii});
}


exports.buildIndex = buildIndex;
function buildIndex(items, _options)
{
	const options = _options || {};

	const index = { all : [], numerical : (options.numerical ? (Array.isArray(options.numerical) ? options.numerical : [options.numerical]) : [])};

	items.forEach((item, i) =>
	{
		index.all.push(i);
		Object.keys(item).forEach(key => processKey(index, item, i, key, options.maxTokens || MAX_TOKENS));
	});

	index.numerical.forEach(numericalKey => { index[numericalKey]._ = index[numericalKey]._.sort((a, b) => (a-b)); });

	return index;
}

function tokenizeText(text)
{
	return unicodeUtil.unicodeToAscii(text).toLowerCase().replaceAll("[\s/_-]", " ").strip("[^A-Za-z0-9 ]").split(" ").filterEmpty();	// eslint-disable-line no-useless-escape
}

function processKey(index, item, idx, key, maxTokens)
{
	const value = item[key];

	if(Array.isArray(value))
	{
		value.forEach(v => addToIndex(index, key, v, idx));
	}
	else if(typeof value==="string")
	{
		const tokens = tokenizeText(value);
		const len = tokens.length;
		for(let z=1;z<=maxTokens;z++)
		{
			for(let i=0;(i+z)<=len;i++)
				addToIndex(index, key, tokens.slice(i, (i+z)).join(" "), idx);
		}
	}
	else if(typeof value==="number")
	{
		if(!index.numerical.includes(key))
			index.numerical.push(key);

		addToIndex(index, key, value, idx);
	}
	else if(typeof value==="boolean")
	{
		addToIndex(index, key, value, idx);
	}
	else
	{
		throw new Error("Un-handled type [" + typeof value + "] for key [" + key + "] with value: " + value);
	}
}

function addToIndex(index, key, _value, i)
{
	const value = typeof _value==="string" ? unicodeUtil.unicodeToAscii(_value).toLowerCase() : _value;

	if(!index.hasOwnProperty(key))
		index[key] = {_ : []};

	if(!index[key].hasOwnProperty(value))
		index[key][value] = [];

	if(!index[key][value].includes(i))
		index[key][value].push(i);

	if(index.numerical.includes(key))
	{
		const valueNum = +((""+value).replace(/[^0-9.]+/, ""));
		if(!index[key]._.includes(valueNum))
			index[key]._.push(valueNum);
	}
}
