// I'll still leverage Node for testing and logging (for now)
const path = require("path");
const fs = require("fs");
function makeFile(targetPath, data, options = null) {
  return fs.writeFileSync(path.resolve(targetPath), data, options);
}

/**
 * I want to try and keep Classes as minimal as possible. Presumably this means keeping any
 * utility functions outside the scope of the Class itself?
 */
class ActionSet {
  rawtext = "";
  data = {};
  constructor(params) {
    if (!JSON) {
      var notifier =
        console && console.log ? console.log : alert ? alert : null;
      if (notifier) {
        notifier("This class cannot be used in JSX without JSON support.");
      } else return null;
    } else {
      // If this is a string:
      if (/string/i.test(typeof params)) {
        // Specifically of JSON:
        if (ActionBoyIsJSON(params)) {
          this.data = JSON.parse(params);
          console.log("Need to build out the structure here");
          // Then we can leverage our JSON > AIA to handle everything
        } else if (/^\/version/.test(params)) {
          // Otherwise it's likely to be aia rawtext, we won't validate it immediately.
          this.rawtext = params;
          this.data = ActionBoyConvertAIAToJSON(params);
        } else {
          console.log("Unrecognized input");
        }
      } else if (/object/i.test(typeof params)) {
        // This is likely to be a File object or a JSON schema. Let's worry about Files later and assume:
        this.data = params;
        console.log("Need to build out the structure here");
      }
    }
  }
}

function ActionBoyConvertAIAToJSON(rawtext) {
  return { hello: "world" };
}

// I don't want to clutter the namespace with common func names to avoid any overlap with a user's codebase
function ActionBoyIsJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
}
/**
 * If I'm not mistaken, the only code I use in actionToJSON that would need polyfilling are
 * Array methods: map, filter, isArray, flat, forEach; then JSON and String.padStart.
 */
function ActionBoyIsArray(arg) {
  return Object.prototype.toString.call(arg) === "[object Array]";
}
function ActionBoyMap(array, callback) {
  var mappedParam = [];
  for (var i = 0; i < array.length; i++)
    mappedParam.push(callback(array[i], i, array));
  return mappedParam;
}
function ActionBoyFilter(array, callback) {
  var filtered = [];
  for (var i = 0; i < array.length; i++)
    if (callback(array[i], i, array)) filtered.push(array[i]);
  return filtered;
}
function ActionBoyForEach(array, callback) {
  for (var i = 0; i < array.length; i++) callback(array[i], i, array);
}

function ActionBoyHexToAscii(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i += 2)
    output += String.fromCharCode(parseInt(input.toString().substr(i, 2), 16));
  return output;
}

function ActionBoyAsciiToHex(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i++)
    output += input.toString().charCodeAt(i).toString(16);
  return output;
}
function ActionBoyAsciiToDecimal(input) {
  return parseInt(asciiToHex(input), 16);
}

function ActionBoyDecimalToAscii(input) {
  return hexToAscii(Number((input + "").trim()).toString(16));
}

function test() {
  var sampleSet = new ActionSet(`/version 3
/name [ 9
	73616d706c65536574
]
/isOpen 1
/actionCount 2
/action-1 {
	/name [ 14
		4170706c7946696c6c436f6c6f72
	]
	/keyIndex 8
	/colorIndex 5
	/isOpen 0
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (ai_plugin_setColor)
		/localizedName [ 9
			53657420636f6c6f72
		]
		/isOpen 1
		/isOn 1
		/hasDialog 0
		/parameterCount 6
		/parameter-1 {
			/key 1768186740
			/showInPalette -1
			/type (ustring)
			/value [ 10
				46696c6c20636f6c6f72
			]
		}
		/parameter-2 {
			/key 1718185068
			/showInPalette -1
			/type (boolean)
			/value 1
		}
		/parameter-3 {
			/key 1954115685
			/showInPalette -1
			/type (enumerated)
			/name [ 9
				52474220636f6c6f72
			]
			/value 2
		}
		/parameter-4 {
			/key 1919247406
			/showInPalette -1
			/type (real)
			/value 234.0
		}
		/parameter-5 {
			/key 1735550318
			/showInPalette -1
			/type (real)
			/value 10.0
		}
		/parameter-6 {
			/key 1651275109
			/showInPalette -1
			/type (real)
			/value 10.0
		}
	}
}
/action-2 {
	/name [ 16
		4170706c795374726f6b65436f6c6f72
	]
	/keyIndex 0
	/colorIndex 0
	/isOpen 1
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (ai_plugin_setColor)
		/localizedName [ 9
			53657420636f6c6f72
		]
		/isOpen 0
		/isOn 1
		/hasDialog 0
		/parameterCount 6
		/parameter-1 {
			/key 1768186740
			/showInPalette -1
			/type (ustring)
			/value [ 12
				5374726f6b6520636f6c6f72
			]
		}
		/parameter-2 {
			/key 1718185068
			/showInPalette -1
			/type (boolean)
			/value 0
		}
		/parameter-3 {
			/key 1954115685
			/showInPalette -1
			/type (enumerated)
			/name [ 9
				52474220636f6c6f72
			]
			/value 2
		}
		/parameter-4 {
			/key 1919247406
			/showInPalette -1
			/type (real)
			/value 239.0
		}
		/parameter-5 {
			/key 1735550318
			/showInPalette -1
			/type (real)
			/value 34.0
		}
		/parameter-6 {
			/key 1651275109
			/showInPalette -1
			/type (real)
			/value 34.0
		}
	}
}
`);
  makeFile(
    path.resolve("./JSX/output.json"),
    JSON.stringify(sampleSet.data, null, 2)
  );
  console.log("Done");
}
test();
