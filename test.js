"use strict";
/* eslint-disable no-multi-spaces */

const XU = require("@sembiance/xu"),
	assert = require("assert"),
	invertedIndex = require("./index.js");

const records =
[
	{ first : "Robert",  last : "Schultz", age : 39, gender : "male",   alive : true },
	{ first : "Tiffany", last : "Schultz", age : 40, gender : "female", alive : true },
	{ first : "Jon",     last : "Kitty",   age : 3,  gender : "male",   alive : false },
	{ first : "Peter",   last : "Cottontail", age : 999, gender : "male", alive : true }
];

const index = invertedIndex.buildIndex(records);

[
	["first:Jon OR first:Robert", [0, 2]],
	["age>5", [0, 1, 3]],
	["age<=39", [0, 2]],
	["gender:male AND age<5", [2]],
	["gender:male AND alive:true", [0, 3]]
].forEach(searchTest => assert(invertedIndex.search(index, searchTest[0]).equals(searchTest[1])));
