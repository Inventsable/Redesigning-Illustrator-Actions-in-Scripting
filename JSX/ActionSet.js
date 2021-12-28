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
  var lines = ActionBoyFilter(rawtext.split(/(\r\n|\r|\n)/g), function (entry) {
    return entry.replace(/(\r\n|\r|\n)/g, "").length;
  });
  var data = ActionBoyMap(lines, function (v, i, a) {
    var child = {
      raw: v,
      index: i,
      depth: /\t/.test(v) ? v.match(/\t/gm).length : 0,
      parent: -1,
      hasBrackets: /[\]\}]/.test(v),
    };
    if (child.depth || child.hasBrackets) {
      for (var cc = i; !!cc; cc--) {
        var lastDepth = /\t/.test(a[cc]) ? a[cc].match(/\t/gm).length : 0;
        if (child.hasBrackets) {
          var squareMatch = /\]/.test(v) && /\[/.test(a[cc]);
          var curlyMatch = /\}/.test(v) && /\{/.test(a[cc]);
          if (child.depth !== lastDepth) continue;
          else if (curlyMatch || squareMatch) {
            child.parent = cc;
            break;
          } else continue;
        } else if (!child.hasBrackets && child.depth > lastDepth) {
          child.parent = cc;
          break;
        } else continue;
      }
    }
    return child;
  });

  var chain = [];
  var rootProps = ActionBoyFilter(data, function (v) {
    return v.parent < 0;
  });
  for (var cc = 0; cc < rootProps.length; cc++)
    chain.push(ActionBoyRecurseForSchema(rootProps[cc], data));

  // Sanitize schema here
  var sanitizedSchema = ActionBoySanitizeSchema(chain);

  // Return translation:
  return ActionBoyTranslateSchema(sanitizedSchema);
}

function ActionBoyTranslateSchema(data, depth) {
  depth = depth || 0;
  var result = {};
  if (data && data.length && ActionBoyIsArray(data)) {
    for (var entry of data) {
      var isEnum = /^\/([^\s-]*)-\d{1,}/;
      if (isEnum.test(ActionBoyTrim(entry.raw))) {
        if (entry && entry.name) {
          var enumName = entry.name.replace(/-.*/, "") + "s";
          result[enumName] = result[enumName] || [];
          if (entry.children && entry.children.length)
            result[enumName].push(
              ActionBoyTranslateSchema(entry.children, depth + 1)
            );
        } else {
          console.log("Something isn't iterating correctly:");
          result["errorFlags"] = result["errorFlags"] || [];
          result.errorFlags.push(entry);
        }
      } else {
        // Otherwise we can simply pass in the value and type to know how to handle each property:
        result[entry.name] = ActionBoySanitizeValue(entry.value, entry.type);
      }
    }
  }
  return result;
}

// This should be simple if we've correctly determined the type above
function ActionBoySanitizeValue(value, type) {
  var temp = ActionBoyTrim(value);
  if (/hex/i.test(type)) {
    temp = ActionBoyTrim(value.replace(/(\[|\])/gm, ""));
    temp = ActionBoyFilter(temp.split(/\t{1,}/gm), function (i, ii) {
      return i.length && ii && /^[a-f0-9]*$/.test(i);
    }).join("");
    temp = ActionBoyHexToAscii(temp);
  } else if (/decimal/i.test(type)) {
    temp = ActionBoyDecimalToAscii(value);
  } else if (!isNaN(Number(value))) {
    // This is probably an integer of some kind. Just in case it fits a decimal format:
    if (/^\d{10}$/.test(temp)) {
      temp = ActionBoyDecimalToAscii(temp);
    } else temp = +value; // Otherwise, let's just convert it to a number
  } else {
    // Chances are this is just a normal string, no need to do anything special
    temp = value;
  }
  return temp;
}

// This is the only part of the process I'm very iffy on. It should be better than this.
//
// "Sanitization" in this context means taking a closer look at each line entry to determine
// if it will need decoding and to define the entry/key:value type. Realistically I should be
// sanitizing and translating at the same time.
function ActionBoySanitizeSchema(data) {
  var temp = [];
  ActionBoyForEach(data, function (rootPropGroup) {
    var rootClone = {
      depth: rootPropGroup.depth,
      raw: rootPropGroup.raw,
      index: rootPropGroup.index,
    };
    // Diagnose and handle any propGroup which may need recursion:
    if (rootPropGroup["children"] && rootPropGroup["children"].length) {
      var isDeep = ActionBoyFilter(rootPropGroup["children"], function (i) {
        return i.children && i.children.length;
      }).length;

      if (!isDeep) {
        rootClone["value"] =
          rootClone.raw +
          ActionBoyMap(rootPropGroup.children, function (i) {
            return i.raw;
          }).join("");

        // Damn. Could I make uglier code if I tried?
        var str = ActionBoyTrim(rootClone.value);
        rootClone["name"] = /\/([^\s]*)/.exec(str)[1];
        str = ActionBoyTrim(str.replace(/^\/([^\s]*)/, ""));
        rootClone.value = str;

        if (/\{/.test(rootClone.value) && /\}/.test(rootClone.value)) {
          rootClone["type"] = "container-B";
          str = ActionBoyTrim(str.replace(/^(\{)|(\})$/gm, ""));

          rootClone.value = str;
          rootClone["children"] = ActionBoyMap(
            str.split(/\t{1,}/gm),
            function (subProp) {
              var subClone = {
                index: -1,
                depth: rootClone.depth + 1,
                name: ActionBoyTrim(subProp)
                  .replace(/^\//, "")
                  .replace(/\s.*/, ""),
                raw: subProp,
                value: ActionBoyTrim(
                  ActionBoyTrim(subProp)
                    .replace(/^\//, "")
                    .replace(/^[\s]*/, "")
                ),
              };
              // This here is sloppy
              subClone.value = new RegExp(`^${subClone.name}`).test(
                subClone.value
              )
                ? ActionBoyTrim(
                    subClone.value.replace(new RegExp(`^${subClone.name}`), "")
                  )
                : subClone.value;
              if (subClone.value + "" == "null")
                subClone.value = ActionBoyTrim(
                  ActionBoyTrim(subProp).replace(/^\/[^\s]/, "")
                );

              return subClone;
            }
          );
        } else if (/\[/.test(rootClone.value) && /\]/.test(rootClone.value))
          rootClone["type"] = "hexadecimal";
        else rootClone["type"] = "undefined-A";
      } else {
        rootClone["name"] = ActionBoyTrim(rootClone.raw).replace(/^\//, "");
        rootClone.name = rootClone.name.match(/[^-]*-\d{1,}/)[0];
        rootClone["type"] = "container-A";
        rootClone["children"] = ActionBoySanitizeSchema(rootPropGroup.children);
      }
      temp.push(rootClone);
    } else if (/^\t*\/[^\s]*/.test(rootPropGroup.raw)) {
      // This is probably a one-line value:
      rootClone["type"] = "param";
      rootClone["value"] = ActionBoyTrim(rootPropGroup.raw);
      if (/\/[^\s]*/.test(rootClone.value))
        rootClone["name"] = /\/([^\s]*)/.exec(rootClone.value)[1];
      else rootClone["name"] = "undefined-B";
      rootClone.value = ActionBoyTrim(
        rootClone.value.replace(`\/${rootClone.name}`, "")
      );

      if (/^\d{10}$/.test(rootClone.value)) rootClone["type"] = "decimal";

      temp.push(rootClone);
    } else {
      // This is almost certainly a closing bracket, empty newline, or format artifact with no real value.
      // We don't need this and can ignore it.
    }
  });
  return temp;
}

// Wow, why didn't I do this before? That's way better than the Node approach
function ActionBoyRecurseForSchema(item, data) {
  var temp = item;
  temp["children"] = ActionBoyMap(
    ActionBoyFilter(data, function (child) {
      return child.parent == item.index;
    }),
    function (child) {
      return ActionBoyRecurseForSchema(child, data);
    }
  );
  return temp;
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
 * Array methods: map, filter, isArray, flat, forEach; then JSON, String.padStart and String.trim?
 */
function ActionBoyTrim(str) {
  return str.replace(/^\s*|\s*$/gm, "");
}
function ActionBoyIsArray(arg) {
  return Object.prototype.toString.call(arg) === "[object Array]";
}
function ActionBoyMap(array, callback) {
  var mappedParam = [];
  for (var i = 0; i < array.length; i++)
    mappedParam.push(callback(array[i], i, array));
  return mappedParam;
}
function ActionBoyFilter(array, callback, debug) {
  debug = debug || false;
  var filtered = [];
  for (var i = 0; i < array.length; i++)
    if (callback(array[i], i, array)) {
      if (debug) console.log("Found match?");
      filtered.push(array[i]);
    }
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
  return parseInt(ActionBoyAsciiToHex(input), 16);
}
function ActionBoyDecimalToAscii(input) {
  return ActionBoyHexToAscii(Number((input + "").trim()).toString(16));
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
