"object" != typeof JSON && (JSON = {}),
  (function () {
    "use strict";
    var rx_one = /^[\],:{}\s]*$/,
      rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
      rx_three =
        /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
      rx_four = /(?:^|:|,)(?:\s*\[)+/g,
      rx_escapable =
        /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      rx_dangerous =
        /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta,
      rep;
    function f(t) {
      return t < 10 ? "0" + t : t;
    }
    function this_value() {
      return this.valueOf();
    }
    function quote(t) {
      return (
        (rx_escapable.lastIndex = 0),
        rx_escapable.test(t)
          ? '"' +
            t.replace(rx_escapable, function (t) {
              var e = meta[t];
              return "string" == typeof e
                ? e
                : "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4);
            }) +
            '"'
          : '"' + t + '"'
      );
    }
    function str(t, e) {
      var r,
        n,
        o,
        u,
        f,
        a = gap,
        i = e[t];
      switch (
        (i &&
          "object" == typeof i &&
          "function" == typeof i.toJSON &&
          (i = i.toJSON(t)),
        "function" == typeof rep && (i = rep.call(e, t, i)),
        typeof i)
      ) {
        case "string":
          return quote(i);
        case "number":
          return isFinite(i) ? String(i) : "null";
        case "boolean":
        case "null":
          return String(i);
        case "object":
          if (!i) return "null";
          if (
            ((gap += indent),
            (f = []),
            "[object Array]" === Object.prototype.toString.apply(i))
          ) {
            for (u = i.length, r = 0; r < u; r += 1) f[r] = str(r, i) || "null";
            return (
              (o =
                0 === f.length
                  ? "[]"
                  : gap
                  ? "[\n" + gap + f.join(",\n" + gap) + "\n" + a + "]"
                  : "[" + f.join(",") + "]"),
              (gap = a),
              o
            );
          }
          if (rep && "object" == typeof rep)
            for (u = rep.length, r = 0; r < u; r += 1)
              "string" == typeof rep[r] &&
                (o = str((n = rep[r]), i)) &&
                f.push(quote(n) + (gap ? ": " : ":") + o);
          else
            for (n in i)
              Object.prototype.hasOwnProperty.call(i, n) &&
                (o = str(n, i)) &&
                f.push(quote(n) + (gap ? ": " : ":") + o);
          return (
            (o =
              0 === f.length
                ? "{}"
                : gap
                ? "{\n" + gap + f.join(",\n" + gap) + "\n" + a + "}"
                : "{" + f.join(",") + "}"),
            (gap = a),
            o
          );
      }
    }
    "function" != typeof Date.prototype.toJSON &&
      ((Date.prototype.toJSON = function () {
        return isFinite(this.valueOf())
          ? this.getUTCFullYear() +
              "-" +
              f(this.getUTCMonth() + 1) +
              "-" +
              f(this.getUTCDate()) +
              "T" +
              f(this.getUTCHours()) +
              ":" +
              f(this.getUTCMinutes()) +
              ":" +
              f(this.getUTCSeconds()) +
              "Z"
          : null;
      }),
      (Boolean.prototype.toJSON = this_value),
      (Number.prototype.toJSON = this_value),
      (String.prototype.toJSON = this_value)),
      "function" != typeof JSON.stringify &&
        ((meta = {
          "\b": "\\b",
          "\t": "\\t",
          "\n": "\\n",
          "\f": "\\f",
          "\r": "\\r",
          '"': '\\"',
          "\\": "\\\\",
        }),
        (JSON.stringify = function (t, e, r) {
          var n;
          if (((gap = ""), (indent = ""), "number" == typeof r))
            for (n = 0; n < r; n += 1) indent += " ";
          else "string" == typeof r && (indent = r);
          if (
            ((rep = e),
            e &&
              "function" != typeof e &&
              ("object" != typeof e || "number" != typeof e.length))
          )
            throw new Error("JSON.stringify");
          return str("", { "": t });
        })),
      "function" != typeof JSON.parse &&
        (JSON.parse = function (text, reviver) {
          var j;
          function walk(t, e) {
            var r,
              n,
              o = t[e];
            if (o && "object" == typeof o)
              for (r in o)
                Object.prototype.hasOwnProperty.call(o, r) &&
                  (void 0 !== (n = walk(o, r)) ? (o[r] = n) : delete o[r]);
            return reviver.call(t, e, o);
          }
          if (
            ((text = String(text)),
            (rx_dangerous.lastIndex = 0),
            rx_dangerous.test(text) &&
              (text = text.replace(rx_dangerous, function (t) {
                return (
                  "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4)
                );
              })),
            rx_one.test(
              text
                .replace(rx_two, "@")
                .replace(rx_three, "]")
                .replace(rx_four, "")
            ))
          )
            return (
              (j = eval("(" + text + ")")),
              "function" == typeof reviver ? walk({ "": j }, "") : j
            );
          throw new SyntaxError("JSON.parse");
        });
  })();

function ActionSet(params) {
  this.rawtext = "";
  this.data = {};
  try {
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
          // Then we can leverage our JSON > AIA to handle everything
        } else if (/^\/version/.test(params)) {
          // Otherwise it's likely to be aia rawtext, we won't validate it immediately.
          this.rawtext = params;
          this.data = ActionBoyConvertAIAToJSON(params);
        } else {
          // console.log("Unrecognized input");
        }
      } else if (/object/i.test(typeof params)) {
        // This is likely to be a File object or a JSON schema. Let's worry about Files later and assume:
        this.data = params;
        // console.log("Need to build out the structure here");
      }
    }
  } catch (err) {
    alert("Construct Error: " + err);
  }
}

ActionSet.prototype = {
  toJSON: function () {
    return ActionBoyConvertAIAToJSON(this.rawtext);
  },
};
// This is fine though sanitize/translate could probably be merged into a single function
function ActionBoyConvertAIAToJSON(rawtext) {
  try {
    // For whatever reason, JSX is splitting the string but keeping \n chars as separate entries?
    // Weird. Node is not doing that, so we'll just try to split any newline and filter those out:
    var lines = ActionBoyFilter(
      rawtext.split(/(\r\n|\r|\n)/g),
      function (entry) {
        return entry.replace(/(\r\n|\r|\n)/g, "").length;
      }
    );
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
  } catch (err) {
    alert("Convert Error: " + err);
  }
}

// This is fine
function ActionBoyTranslateSchema(data, depth) {
  try {
    depth = depth || 0;
    var result = {};
    if (data && data.length && ActionBoyIsArray(data)) {
      for (var i = 0; i < data.length; i++) {
        var entry = data[i];
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
  } catch (err) {
    alert("Translate Error: " + err);
  }
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
  } else if (/decimal/i.test(type)) temp = ActionBoyDecimalToAscii(value);
  else if (!isNaN(Number(value))) {
    // This is probably an integer of some kind. Just in case it fits a decimal format:
    if (/^\d{10}$/.test(temp)) temp = ActionBoyDecimalToAscii(temp);
    else temp = +value; // Otherwise, let's just convert it to a number
  } else temp = value; // Chances are this is just a normal string
  return temp;
}

// This is the only part of the process I'm very iffy on. It should be better than this.
//
// "Sanitization" in this context means taking a closer look at each line entry to determine
// if it will need decoding and to define the entry/key:value type. Realistically I should be
// sanitizing and translating at the same time.
function ActionBoySanitizeSchema(data) {
  try {
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
                subClone.value = new RegExp("^" + subClone.name).test(
                  subClone.value
                )
                  ? ActionBoyTrim(
                      subClone.value.replace(
                        new RegExp("^" + subClone.name),
                        ""
                      )
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
          rootClone["children"] = ActionBoySanitizeSchema(
            rootPropGroup.children
          );
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
          rootClone.value.replace("\\/" + rootClone.name, "")
        );

        if (/^\d{10}$/.test(rootClone.value)) rootClone["type"] = "decimal";

        temp.push(rootClone);
      } else {
        // This is almost certainly a closing bracket, empty newline, or format artifact with no real value.
        // We don't need this and can ignore it.
      }
    });
    return temp;
  } catch (err) {
    alert("Sanitize Schema Error: " + err);
  }
}

// Wow, why didn't I do this before? That's way better than the Node approach
function ActionBoyRecurseForSchema(item, data) {
  try {
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
  } catch (err) {
    alert("Recurse Schema Error: " + err);
  }
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
  var sampleSet = new ActionSet(
    "/version 3\r\n/name [ 7\r\n\t74656d70536574\r\n]\r\n/isOpen 1\r\n/actionCount 1\r\n/action-1 {\r\n\t/name [ 10\r\n\t\t74656d70416374696f6e\r\n\t]\r\n\t/keyIndex 0\r\n\t/colorIndex 0\r\n\t/isOpen 0\r\n\t/eventCount 1\r\n\t/event-1 {\r\n\t\t/useRulersIn1stQuadrant 0\r\n\t\t/internalName (ai_plugin_setColor)\r\n\t\t/localizedName [ 9\r\n\t\t\t53657420636f6c6f72\r\n\t\t]\r\n\t\t/isOpen 1\r\n\t\t/isOn 1\r\n\t\t/hasDialog 0\r\n\t\t/parameterCount 6\r\n\t\t/parameter-1 {\r\n\t\t\t/key 1768186740\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (ustring)\r\n\t\t\t/value [ $TYPEHEXLENGTH$\r\n\t\t\t\t$TYPEHEX$\r\n\t\t\t]\r\n\t\t}\r\n\t\t/parameter-2 {\r\n\t\t\t/key 1718185068\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (boolean)\r\n\t\t\t/value $ISFILL$\r\n\t\t}\r\n\t\t/parameter-3 {\r\n\t\t\t/key 1954115685\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (enumerated)\r\n\t\t\t/name [ 9\r\n\t\t\t\t52474220636f6c6f72\r\n\t\t\t]\r\n\t\t\t/value 2\r\n\t\t}\r\n\t\t/parameter-4 {\r\n\t\t\t/key 1919247406\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value $RVALUE$\r\n\t\t}\r\n\t\t/parameter-5 {\r\n\t\t\t/key 1735550318\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value $GVALUE$\r\n\t\t}\r\n\t\t/parameter-6 {\r\n\t\t\t/key 1651275109\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value $BVALUE$\r\n\t\t}\r\n\t}\r\n}"
  );
  // makeFile(
  //   path.resolve("./JSX/output.json"),
  //   JSON.stringify(sampleSet.data, null, 2)
  // );
  // console.log("Done");
  var tmp = File(Folder.desktop + "/output.json");
  tmp.open("w");
  tmp.write(JSON.stringify(sampleSet.data));
  tmp.close();
  alert("Done?");
}
test();
