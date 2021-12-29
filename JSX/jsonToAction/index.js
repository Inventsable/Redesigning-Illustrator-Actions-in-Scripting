const path = require("path");
const fs = require("fs");
async function printAIA() {
  let data = await readFile(path.resolve("./JSX/jsonToAction/input.json"));
  let outputDest = path.resolve("./JSX/jsonToAction/output.aia");

  let result = convertToAIA(JSON.parse(data));
  makeFile(outputDest, result);
  console.log("Printed to:", outputDest);
}
printAIA();
async function readFile(targetPath, verbose = false) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(targetPath), "utf-8", (err, data) => {
      if (err) reject(err);
      if (!verbose) resolve(data);
      let temp = {
        data: data,
        stats: fs.lstatSync(path.resolve(targetPath)),
      };
      resolve(temp);
    });
  });
}
function makeFile(targetPath, data, options = null) {
  return fs.writeFileSync(path.resolve(targetPath), data, options);
}

function convertToAIA(obj) {
  function chunkSubstr(str, size) {
    var numChunks = Math.ceil(str.length / size);
    var chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size)
      chunks[i] = str.substr(o, size);
    return chunks;
  }
  // If we write one good enough function to print lines in AIA format,
  // we can recurse inside any enumerables like actions/events/parameters:
  function unfoldPerDepth(obj, str = "", depth = 0, parent = null) {
    // The recursion depth is the same as our leading \t characters:
    var padding = "";
    for (var p = 0; p < depth; p++) padding += "\t";

    var keylist = [];
    for (var key in obj) keylist.push(key);

    // Iterate over the properties of this object as if it were an Array:
    ActionBoyForEach(keylist, function (key, mainIndex) {
      DEBUG_STR += key + ": ";
      // We need to handle any edge cases, so we create a diagnostic for them:
      var conditions = hasConditionalFormatting(key, obj[key], depth, obj);

      // If nothing came back we know the formatting is very simple:
      if (conditions.isNone) str += padding + "/" + key + " " + obj[key];
      else if (conditions.isReal)
        str += padding + "/" + key + " " + obj[key] + ".0";
      else if (conditions.isHex) {
        // Otherwise we have to handle formatting per condition
        var hex = ActionBoyAsciiToHex(obj[key]);
        var byteLength = hex.length;
        // AIA seems to only display 64 chars in sequence
        if (byteLength > 64)
          hex = ActionBoyMap(chunkSubstr(hex, 64), function (i, nn) {
            return (nn ? padding + "\t" : "") + i;
          }).join("\r\n");
        str +=
          padding +
          "/" +
          key +
          " [ " +
          byteLength / 2 +
          "\r\n" +
          padding +
          "\t" +
          hex +
          "\r\n" +
          padding +
          "]";
      } else if (conditions.isDec) {
        // Decimal conversion is straightforward, just need to encode the values:
        str += padding + "/" + key + " " + ActionBoyAsciiToDecimal(obj[key]);
      } else if (conditions.isEnum) {
        // Enums are where we recurse and loop into children with this same function
        var enumKey = key.replace(/s$/, "");
        // Doublecheck we know what data we're dealing with:
        if (ActionBoyIsArray(obj[key]))
          ActionBoyForEach(obj[key], function (value, index) {
            // Then for each enum, print out an AIA style block:
            str += padding + "/" + enumKey + "-" + (index + 1) + " {\r\n";
            // Recurse into the child to print it normally
            str = unfoldPerDepth(value, str, depth + 1, obj);
            // Then close the block
            str += padding + "}\r\n";
          });
      }
      // Just to ensure that props are being printed on separate lines:
      str += "\r\n";
      DEBUG_STR += "\r\n";
    });
    return str;
  }
  /**
   * Not bad for converting from Node, though it does still seem a bit obtuse. I'm unsure if funcs
   * are necessary at all here but I wanted to have the most versatile way of determining something,
   * and it still seems like I'd be able to do far more with funcs (if need be) than static expressions
   */
  function hasConditionalFormatting(key, value, depth, parent) {
    var conditions = {
      isEnum: [
        function () {
          return ActionBoyArrayIncludes(
            ["actions", "events", "parameters"],
            key
          );
        },
      ],
      isHex: [
        function () {
          return ActionBoyArrayIncludes(["name"], key);
        },
        function () {
          return ActionBoyArrayIncludes(["localizedName"], key);
        },
        function () {
          return (
            key == "value" &&
            parent["type"] &&
            ActionBoyArrayIncludes(["(ustring)"], parent["type"])
          );
        },
      ],
      isDec: [
        function () {
          return depth > 2 && ActionBoyArrayIncludes(["key"], key);
        },
      ],
      isReal: [
        function () {
          return (
            key == "value" &&
            parent["type"] &&
            /real/i.test(parent["type"]) &&
            !/\./.test(value)
          );
        },
      ],
    };
    var diagnostic = [];
    for (var keyFunc in conditions)
      for (var i = 0; i < conditions[keyFunc].length; i++) {
        if (conditions[keyFunc][i](...arguments)) diagnostic.push(keyFunc);
      }
    return {
      isEnum: ActionBoyArrayIncludes(diagnostic, "isEnum"),
      isHex: ActionBoyArrayIncludes(diagnostic, "isHex"),
      isDec: ActionBoyArrayIncludes(diagnostic, "isDec"),
      isReal: ActionBoyArrayIncludes(diagnostic, "isReal"),
      isNone: !diagnostic.length,
    };

    function isJSON(str) {
      try {
        str = JSON.parse(str);
        return true;
      } catch (err) {
        return false;
      }
    }
  }
  return (
    unfoldPerDepth(obj)
      .split("\r\n")
      .filter((i) => i.length)
      .join("\r\n") + "\r\n"
  );
}

function ActionBoyIsJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
}

function ActionBoyArrayIncludes(haystack, needle) {
  for (var i = 0; i < haystack.length; i++)
    if (haystack[i] == needle) return true;
  return false;
}
function ActionBoyPadStart(count, char) {
  var str = "";
  for (var i = 0; i < 0; i++) str += char;
  return str;
}
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
function ActionBoyObjectKeys(obj) {
  var list = [];
  for (var key in obj) list.push(key);
  return list;
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
  return ActionBoyHexToAscii(Number(ActionBoyTrim(input + "")).toString(16));
}
