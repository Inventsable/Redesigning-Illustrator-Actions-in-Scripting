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
    let temp = unfoldPerDepth(this.raw);
    this.value = temp;
    console.log(temp);
  }
}

function unfoldPerDepth(obj, str = "", depth = 0, parent = null, enumI = 0) {
  let padding = "";
  for (let i = 1; i <= depth; i++) padding += "\\t";
  Object.keys(obj).forEach((key) => {
    let conditions = hasConditionalFormatting(key, obj[key], depth, obj);
    if (conditions.isNone) {
      str += `${padding}/${key} ${obj[key]}`;
    } else if (conditions.isHex) {
      let hex = asciiToHex(obj[key]);
      str += `${padding}/${key} [ ${
        hex.length / 2
      }\r\n${padding}\t${hex}\r\n${padding}]`;
    } else if (conditions.isDec) {
      str += `${padding}/${key} ${asciiToDecimal(obj[key])}`;
    } else if (conditions.isEnum) {
      str += "bop";
    }
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
      () => depth == 0 && ["name"].includes(key),
      () => key == "value" && parent["key"] && parent["key"] == "idct",
    ],
    isDec: [() => depth > 2 && ["key"].includes(key)],
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
    isNone: !diagnostic.length,
  };
}

function lookup(key, value, depth, parent) {}

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
