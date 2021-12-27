/**
 * I'm hoping this part will be much easier. I'll probably need to have a lookup function for key/value,
 * then determine the formatting and encoding while recursing down and using depth to determine tabs
 */

class JSONtoAction {
  raw = null;
  data = null;
  schema = null;
  value = "none";
  constructor(param) {
    // Realistically I should be validating this before touching it
    if (/string/i.test(param)) {
      if (isJSON(param)) {
        this.raw = JSON.parse(param);
        this.createSchema();
      }
    } else if (/object/i.test(param)) {
      this.raw = param;
      this.createSchema();
    }
  }
  get schema() {
    return this.createSchema();
  }
  get data() {
    return this.data;
  }
  createSchema() {
    this.value =
      unfoldPerDepth(this.raw)
        .split("\r\n")
        .filter((i) => i.length)
        .join("\r\n") + "\r\n";
  }
}

function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);
  for (let i = 0, o = 0; i < numChunks; ++i, o += size)
    chunks[i] = str.substr(o, size);
  return chunks;
}

function unfoldPerDepth(obj, str = "", depth = 0, parent = null) {
  let padding = "";
  for (let i = 1; i <= depth; i++) padding += "\t";
  Object.keys(obj).forEach((key, mainIndex) => {
    // Use our super slick diagnostic function
    let conditions = hasConditionalFormatting(key, obj[key], depth, obj);
    // If nothing came back we know the formatting is very simple:
    if (conditions.isNone) str += `${padding}/${key} ${obj[key]}`;
    else if (conditions.isReal) str += `${padding}/${key} ${obj[key]}.0`;
    else if (conditions.isHex) {
      // Otherwise we have to handle formatting per condition
      let hex = asciiToHex(obj[key]);
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
      str += `${padding}/${key} ${asciiToDecimal(obj[key])}`;
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
    isEnum: [() => ["actions", "events", "parameters"].includes(key)],
    isHex: [
      () => ["name"].includes(key),
      () => ["localizedName"].includes(key),
      () =>
        key == "value" &&
        parent["type"] &&
        ["(ustring)"].includes(parent["type"]),
    ],
    isDec: [() => depth > 2 && ["key"].includes(key)],
    isReal: [
      () =>
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

function asciiToHex(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i++)
    output += input.toString().charCodeAt(i).toString(16);
  return output;
}
function asciiToDecimal(input) {
  return parseInt(asciiToHex(input), 16);
}

module.exports = JSONtoAction;
