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
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size)
      chunks[i] = str.substr(o, size);
    return chunks;
  }

  // If we write one good enough function to print lines in AIA format,
  // we can recurse inside any enumerables like actions/events/parameters:
  function unfoldPerDepth(obj, str = "", depth = 0, parent = null) {
    // The recursion depth is the same as our leading \t characters:
    let padding = "".padStart(depth, "\t");

    // Iterate over the properties of this object as if it were an Array:
    Object.keys(obj).forEach((key, mainIndex) => {
      // We need to handle any edge cases, so we create a diagnostic for them:
      let conditions = hasConditionalFormatting(key, obj[key], depth, obj);
      //
      // If nothing came back we know the formatting is very simple:
      if (conditions.isNone) str += `${padding}/${key} ${obj[key]}`;
      else if (conditions.isReal) str += `${padding}/${key} ${obj[key]}.0`;
      else if (conditions.isHex) {
        // Otherwise we have to handle formatting per condition
        let hex = ActionBoyAsciiToHex(obj[key]);
        let byteLength = hex.length;
        // AIA seems to only display 64 chars in sequence
        if (byteLength > 64)
          hex = chunkSubstr(hex, 64)
            .map((i, nn) => `${nn ? `${padding}\t` : ""}${i}`)
            .join("\r\n");
        str += `${padding}/${key} [ ${
          byteLength / 2
        }\r\n${padding}\t${hex}\r\n${padding}]`;
      } else if (conditions.isDec) {
        // Decimal conversion is straightforward, just need to encode the values:
        str += `${padding}/${key} ${ActionBoyAsciiToDecimal(obj[key])}`;
      } else if (conditions.isEnum) {
        // Enums are where we recurse and loop into children with this same function
        let enumKey = key.replace(/s$/, "");
        // Doublecheck we know what data we're dealing with:
        if (Array.isArray(obj[key]))
          obj[key].forEach((value, index) => {
            // Then for each enum, print out an AIA style block:
            str += `${padding}/${enumKey}-${index + 1} {\r\n`;
            // Recurse into the child to print it normally
            str = unfoldPerDepth(value, str, depth + 1, obj);
            // Then close the block
            str += `${padding}}\r\n`;
          });
      }
      // Just to ensure that props are being printed on separate lines:
      str += "\r\n";
    });
    return str;
  }

  /**
   * Is this extremely clever or extremely naive? I can't tell. I've never created validation engines before,
   * this is probably similar to how custom input elements run dynamic validation rules?
   *
   * The idea is that I have an unspecified and possibly dynamic number of edge cases. If I can feed all the data
   * into an array containing functions that specifically check for some particular edge case, I can filter that.
   *
   * If I can guarantee each particular edge case from some particular function, I know what formatting is needed.
   */
  function hasConditionalFormatting(key, value, depth, parent) {
    let conditions = {
      isEnum: [["actions", "events", "parameters"].includes(key)],
      isHex: [
        ["name"].includes(key),
        ["localizedName"].includes(key),
        key == "value" &&
          parent["type"] &&
          ["(ustring)"].includes(parent["type"]),
      ],
      isDec: [depth > 2 && ["key"].includes(key)],
      isReal: [
        key == "value" &&
          parent["type"] &&
          /real/i.test(parent["type"]) &&
          !/\./.test(value),
      ],
    };
    let diagnostic = Object.keys(conditions)
      .map((k) => {
        return [
          ...new Set(
            conditions[k]
              .map((func) => {
                return func(...arguments) ? k : false;
              })
              .filter((i) => i && i.length)
          ),
        ];
      })
      .flat()
      .filter((i) => i);
    return {
      isEnum: diagnostic.includes("isEnum"),
      isHex: diagnostic.includes("isHex"),
      isDec: diagnostic.includes("isDec"),
      isReal: diagnostic.includes("isReal"),
      isNone: !diagnostic.length,
    };
  }
  function isJSON(str) {
    try {
      str = JSON.parse(str);
      return true;
    } catch (err) {
      return false;
    }
  }
  return (
    unfoldPerDepth(obj)
      .split("\r\n")
      .filter((i) => i.length)
      .join("\r\n") + "\r\n"
  );
}

function ActionBoyArrayIncludes(list, item) {
  for (var i = 0; i < list.length; i++) if (list[i] == item) return true;
  return false;
}
function ActionBoyIsJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
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
