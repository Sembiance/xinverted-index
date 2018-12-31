{
	var index = options.index;
	var unicodeToAscii = options.unicodeToAscii;

	// Subtract sorted integer array b from a
	var subtract = function(a, b)
	{
		var ai=0, bi=0;
		var alen=a.length, blen=b.length;
		var results=[];

		while(ai<alen && bi<blen)
		{
			if(a[ai]<b[bi])
			{
				results.push(a[ai]);
				ai++;
			}
			else if(a[ai]>b[bi])
			{
				bi++;
			}
			else
			{
				ai++;
				bi++;
			}
		}

		return results;
	};

	// Intersection of sorted integer arrays a and b
	var intersect = function(a, b)
	{
		var ai=0, bi=0;
		var alen=a.length, blen=b.length;
		var results=[];

		while(ai<alen && bi<blen)
		{
			if(a[ai]<b[bi])
			{
				ai++;
			}
			else if(a[ai]>b[bi])
			{
				bi++;
			}
			else
			{
				results.push(a[ai]);
				ai++;
				bi++;
			}
		}

		return results;
	};

	// Union of sorted integer arrays a and b
	var union = function(a, b)
	{
		var alen=a.length, blen=b.length;
		var ai=0, bi=0;
		var results=[];

		while(ai<alen && bi<blen)
		{
			if(a[ai]<b[bi])
			{
				results.push(a[ai++]);
			}
			else if(b[bi]<a[ai])
			{
				results.push(b[bi++]);
			}
			else
			{
				ai++;
				results.push(b[bi++]);
			}
		}

		while(ai<alen)
			results.push(a[ai++]);
		while(bi<blen)
			results.push(b[bi++]);

		return results;
	};
}

START
	= LEFTRIGHTMATCH

LEFTRIGHTMATCH
	= left:MATCH _ "AND" _ right:LEFTRIGHTMATCH { if(options.log) { console.log("AND %d %d", left.length, right.length); } return intersect(left, right); }
	/ left:MATCH _ "OR" _ right:LEFTRIGHTMATCH { if(options.log) { console.log("OR %d %d", left.length, right.length); } return union(left, right); }
	/ MATCH

MATCH
	= not:("NOT" _)? key:KEY comparator:COMPARATOR value:VALUE
	{
		key = unicodeToAscii(key).toLowerCase();
		value= unicodeToAscii(value).toLowerCase();

		//if(!index.hasOwnProperty(key))
		//	throw new SyntaxError("Invalid key: " + key);
		//if((comparator.startsWith("<") || comparator.startsWith(">")) && !index.numerical.contains(key))
		//	throw new SyntaxError("Invalid numerical comparator [%s] for key: %s", comparator, key);
		//if(!index[key].hasOwnProperty(value))
		//	throw new SyntaxError("Invalid value [" + value + "] for key: " + key);

		var values = [];
		var valueAsNum = +((""+value).replace(/[^0-9.]+/, ""));
		if(comparator.startsWith("<") || comparator.startsWith(">"))
		{
			index[key]["_"].forEach(function(otherVal)
			{
				if((comparator==="<"  && otherVal<valueAsNum) ||
				   (comparator==="<=" && otherVal<=valueAsNum) ||
				   (comparator===">"  && otherVal>valueAsNum) ||
				   (comparator===">=" && otherVal>=valueAsNum))
					values.push(otherVal);
			});
		}
		else
		{
			values.push(value);
		}

		var results = [];
		values.forEach(function(subval)
		{
			if(index[key].hasOwnProperty(""+subval))
				results = union(results, intersect(index.all.slice(), index[key][(""+subval)]));
		});

		if(not || comparator==="!=")
			results = subtract(index.all, results);

		if(options.log)
			console.log("MATCH: %s %s %s %d", key, comparator, value, results.length);

		return results;
	}
	/ "(" submatch:LEFTRIGHTMATCH ")" { return submatch; }

KEY
	= chars:[^:><=!()]+ { return chars.join(""); }

COMPARATOR
	= (":" / "!=" / "=" / ">=" / "<=" / ">" / "<" )

VALUE
	= (unquoted_value / quoted_value)

unquoted_value
	= chars:[^ \t\v\f\r\n\u00A0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000)("]+ { return chars.join(""); }

quoted_value
	= '"' chars:chars_no_quot '"' _ { return chars; }

chars_no_quot
	= chars:char_no_quot+ { return chars.join(""); }

char_no_quot
	= char_escape_sequence
	/ '""' { return '"'; }
	/ [^"]

char_escape_sequence
	= "\\\\"  { return "\\"; }
	/ '\\"'   { return '"';  }

_ "whitespace"
	= whitespace*

__ "whitespace"
	= whitespace+

whitespace "whitespace"
	= [ \t\v\f\r\n\u00A0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]
