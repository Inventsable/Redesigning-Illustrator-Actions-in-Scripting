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

/**
 * Since we need Array-Likes to replicate Document.pageItems acting as an array with
 * custom functions like .add(), we can begin each Array-Like as an actual array
 * then mimick an Object.assign call so they inherit new prototype methods
 */
function extendPrototype(target) {
  var arg, obj, key;
  for (arg = 1; arg < arguments.length; ++arg) {
    obj = arguments[arg];
    for (key in obj) if (obj.hasOwnProperty(key)) target[key] = obj[key];
  }
  return target;
}

/**
 * Any Array-Likes need to have parents explicitly set at time of creation.
 * Since a user has these generated in their parents, it shouldn't be an issue
 */
function ActionParameters(arr, parent) {
  arr = arr || [];
  extendPrototype(arr, {
    add: function () {
      for (var i = 0; i < arguments.length; i++) {
        arguments[i]["parent"] = this;
        if (arguments[i].typename && arguments[i].typename == "ActionParameter")
          this.push(arguments[i]);
        else if (!arguments[i].typename)
          this.push(new ActionParameter(arguments[i]));
      }
      this.parent.parameterCount = this.length;
    },
    removeAll: function () {
      for (var i = this.length; !!i; i--) this.pop();
      this.parent.parameterCount = this.length;
    },
  });
  arr.parent = parent;
  arr.typename = "ActionParameters";
  return arr;
}
function ActionEvents(arr, parent) {
  arr = arr || [];
  extendPrototype(arr, {
    add: function () {
      for (var i = 0; i < arguments.length; i++) {
        arguments[i]["parent"] = this;
        if (arguments[i].typename && arguments[i].typename == "ActionEvent")
          this.push(arguments[i]);
        else if (!arguments[i].typename)
          this.push(new ActionEvent(arguments[i]));
      }
      this.parent.eventCount = this.length;
    },
    removeAll: function () {
      for (var i = this.length; !!i; i--) this.pop();
      this.parent.eventCount = this.length;
    },
  });
  arr.parent = parent;
  arr.typename = "ActionEvents";
  return arr;
}
function Actions(arr, parent) {
  arr = arr || [];
  extendPrototype(arr, {
    add: function () {
      for (var i = 0; i < arguments.length; i++) {
        arguments[i]["parent"] = this;
        if (arguments[i].typename && arguments[i].typename == "Action")
          this.push(arguments[i]);
        else if (!arguments[i].typename) this.push(new Action(arguments[i]));
      }
      this.parent.actionCount = this.length;
    },
    removeAll: function () {
      for (var i = this.length; !!i; i--) this.pop();
      this.parent.actionCount = this.length;
    },
    getByName: function (query) {
      for (var i = 0; i < this.length; i++)
        if (this[i].name && this[i].name == query) return this[i];
      return null;
    },
  });
  arr.parent = parent || null;
  arr.typename = "ActionCollection";
  return arr;
}

function ActionParameter(obj, parent) {
  this.typename = "ActionParameter";
  this.parent = parent || null;
  this.key = null;
  this.showInPalette = -1;
  this.type = null;
  this.value = null;
  for (var key in obj) this[key] = obj[key];
}
function ActionEvent(obj, parent) {
  this.typename = "ActionEvent";
  this.parent = parent || null;
  this.useRulersIn1stQuadrant = 0;
  this.internalName = null;
  this.localizedName = null;
  this.isOpen = 0;
  this.isOn = 1;
  this.hasDialog = 0;
  this.parameterCount = 0;
  this.parameters = new ActionParameters([], this);
  for (var key in obj)
    if (key == "parameters")
      for (var i = 0; i < obj.parameters.length; i++)
        this.parameters.add(obj.parameters[i]);
    else this[key] = obj[key];
}
function Action(obj, parent) {
  this.parent = parent || null;
  this.typename = "Action";
  this.eventCount = 0;
  this.events = new ActionEvents([], this);
  for (var key in obj)
    if (key == "events")
      for (var i = 0; i < obj.events.length; i++)
        this.events.add(obj.events[i]);
    else this[key] = obj[key];
}
Action.prototype.run = function () {
  // This should trigger a reload of rawtext and Actions
  // If properly parent-chained, it could call the root to regenerate AIA text and reload
  if (this.parent && this.parent.parent) {
    app.doScript(this.name, this.parent.parent.name, false);
  } else {
    alert(
      "Action is not properly mounted to a parent chain of Self > Collection > Set"
    );
  }
};

function ActionSet(params) {
  this.typename = "ActionSet";
  this.name = "";
  this.version = 3;
  this.isOpen = 0;
  this.actionCount = 0;
  this.actions = new Actions([], this);
  this.rawtext = null;
  var data;
  try {
    // If this is a string:
    if (/string/i.test(typeof params)) {
      // Specifically of JSON:
      if (ActionBoyIsJSON(params)) {
        data = JSON.parse(params);
        // Then we can leverage our JSON > AIA to handle everything
      } else if (/^\/version/.test(params)) {
        // Otherwise it's likely to be aia rawtext, we won't validate it immediately.
        data = ActionBoyConvertAIAToJSON(params);
      } else {
        // This is an unrecognized format
      }
    } else if (/object/i.test(typeof params)) {
      if (params.typename && /file/i.test(params.typename)) {
        // Should load AIA text through a file
        params.encoding = "UTF8";
        params.open("r");
        var content = params.read();
        params.close();
        data = ActionBoyConvertAIAToJSON(content);
      } else {
        // This is likely to be a File object or a JSON schema. Let's worry about Files later and assume:
        data = params;
      }
    }
    if (data) {
      for (var root in data) this[root] = data[root];
    }
  } catch (err) {
    alert("Construct Error: " + err);
  }
  function isJSON(str) {
    try {
      str = JSON.parse(str);
      return true;
    } catch (err) {
      return false;
    }
  }
  // This is fine though sanitize/translate could probably be merged into a single function
  function ActionBoyConvertAIAToJSON(rawtext) {
    try {
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
      var sanitizedSchema = ActionBoySanitizeSchema(chain);
      return ActionBoyTranslateSchema(sanitizedSchema);
    } catch (err) {
      alert("Convert Error: " + err);
    }
  }
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
            result[entry.name] = ActionBoySanitizeValue(
              entry.value,
              entry.type
            );
          }
        }
      }
      return result;
    } catch (err) {
      alert("Translate Error: " + err);
    }
  }
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
  function ActionBoySanitizeSchema(data) {
    try {
      var temp = [];
      ActionBoyForEach(data, function (rootPropGroup) {
        var rootClone = {
          depth: rootPropGroup.depth,
          raw: rootPropGroup.raw,
          index: rootPropGroup.index,
        };
        // Diagnose and handle any propGroup which may need recursion, we want
        // to collapse lines like "/name [ 8 120fda9011290 ]" from 4 lines to 1
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
                  // Starting to see keys assigned within values on JSX,
                  // something went wrong switching RegExp from string literals
                  if (new RegExp(subClone.name).test(subClone.value))
                    subClone.value = ActionBoyTrim(
                      subClone.value.replace(subClone.name, "")
                    );
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
            rootClone.value.replace("/" + rootClone.name, "")
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
}
ActionSet.prototype = {
  load: function () {
    alert("Not yet supported");
  },
  unload: function () {
    try {
      var temp = app.unloadAction(this.name, "");
      return /undefined/i.test(temp + "");
    } catch (err) {
      return false;
    }
  },
  toJSON: function () {
    return this.getJSONSchema();
  },
  toJSONString: function () {
    return JSON.stringify(this.getJSONSchema());
  },
  toAIA: function () {
    function ActionBoyConvertJSONToAIA(obj) {
      function chunkSubstr(str, size) {
        var numChunks = Math.ceil(str.length / size);
        var chunks = new Array(numChunks);
        for (var i = 0, o = 0; i < numChunks; ++i, o += size)
          chunks[i] = str.substr(o, size);
        return chunks;
      }
      function chunkSubstr(str, size) {
        var numChunks = Math.ceil(str.length / size);
        var chunks = new Array(numChunks);
        for (var i = 0, o = 0; i < numChunks; ++i, o += size)
          chunks[i] = str.substr(o, size);
        return chunks;
      }
      function unfoldPerDepth(obj, str, depth, parent) {
        str = str || "";
        depth = depth || 0;
        parent = parent || null;
        var padding = "";
        for (var p = 0; p < depth; p++) padding += "\t";
        var keylist = [];
        for (var key in obj) keylist.push(key);
        ActionBoyForEach(keylist, function (key, mainIndex) {
          var conditions = hasConditionalFormatting(key, obj[key], depth, obj);
          if (conditions.isNone) str += padding + "/" + key + " " + obj[key];
          else if (conditions.isReal)
            str += padding + "/" + key + " " + obj[key] + ".0";
          else if (conditions.isHex) {
            var hex = ActionBoyAsciiToHex(obj[key]);
            var byteLength = hex.length;
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
            str +=
              padding + "/" + key + " " + ActionBoyAsciiToDecimal(obj[key]);
          } else if (conditions.isEnum) {
            var enumKey = key.replace(/s$/, "");
            if (ActionBoyIsArray(obj[key]))
              ActionBoyForEach(obj[key], function (value, index) {
                str += padding + "/" + enumKey + "-" + (index + 1) + " {\r\n";
                str = unfoldPerDepth(value, str, depth + 1, obj);
                str += padding + "}\r\n";
              });
          }
          str += "\r\n";
        });
        return str;
      }
      function hasConditionalFormatting(key, value, depth, parent) {
        function ActionBoyArrayIncludes(haystack, needle) {
          for (var i = 0; i < haystack.length; i++)
            if (haystack[i] == needle) return true;
          return false;
        }
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
            var passCondition = conditions[keyFunc][i](
              arguments[0],
              arguments[1],
              arguments[2],
              arguments[3]
            );
            if (passCondition) diagnostic.push(keyFunc);
          }
        return {
          isEnum: ActionBoyArrayIncludes(diagnostic, "isEnum"),
          isHex: ActionBoyArrayIncludes(diagnostic, "isHex"),
          isDec: ActionBoyArrayIncludes(diagnostic, "isDec"),
          isReal: ActionBoyArrayIncludes(diagnostic, "isReal"),
          isNone: !diagnostic.length,
        };
      }
      return (
        ActionBoyFilter(unfoldPerDepth(obj).split("\r\n"), function (arg) {
          return arg && arg.length;
        }).join("\r\n") + "\r\n"
      );
    }
    return ActionBoyConvertJSONToAIA(this.getJSONSchema());
  },
  getJSONSchema: function () {
    function recurseInto(obj) {
      var shouldOmit = new RegExp(
          "^(" +
            [
              "toJSON",
              "load",
              "unload",
              "toJSONString",
              "getJSONSchema",
              "filter",
              "map",
              "forEach",
              "add",
              "removeAll",
              "getByName",
              "typename",
              "rawtext",
              "parent",
              "toAIA",
            ].join("|") +
            ")$"
        ),
        key,
        temp = {},
        keylist = [];
      for (key in obj) if (!shouldOmit.test(key)) keylist.push(key);
      keylist = sortByPriority(keylist, obj.typename);
      for (var kk = 0; kk < keylist.length; kk++)
        temp[keylist[kk]] = obj[keylist[kk]];
      return temp;
    }
    function sortByPriority(keys, typename) {
      function indexOf(list, entry) {
        var i = 0;
        for (i = 0; i < list.length; i++) if (list[i] == entry) return i;
        return -1;
      }
      var lookup = {
        ActionSet: ["version", "name", "isOpen", "actionCount", "actions"],
        Action: [
          "name",
          "keyIndex",
          "colorIndex",
          "isOpen",
          "eventCount",
          "events",
        ],
        ActionEvent: [
          "useRulersIn1stQuadrant",
          "internalName",
          "localizedName",
          "isOpen",
          "isOn",
          "hasDialog",
          "parameterCount",
          "parameters",
        ],
        ActionParameter: ["key", "showInPalette", "type", "value"],
      };
      return keys.sort(function (a, b) {
        return indexOf(lookup[typename], a) - indexOf(lookup[typename], b);
      });
    }
    return recurseInto(this);
  },
};
function ActionBoyAsciiToHex(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i++)
    output += input.toString().charCodeAt(i).toString(16);
  return output;
}
function ActionBoyAsciiToDecimal(input) {
  return parseInt(ActionBoyAsciiToHex(input), 16);
}
function ActionBoyHexToAscii(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i += 2)
    output += String.fromCharCode(parseInt(input.toString().substr(i, 2), 16));
  return output;
}
function ActionBoyDecimalToAscii(input) {
  return ActionBoyHexToAscii(Number(ActionBoyTrim(input + "")).toString(16));
}
function ActionBoyIsJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
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
// ---------------------------------------- //

var sampleSet = new ActionSet(
  "/version 3\r\n/name [ 9\r\n\t73616d706c65536574\r\n]\r\n/isOpen 1\r\n/actionCount 2\r\n/action-1 {\r\n\t/name [ 14\r\n\t\t4170706c7946696c6c436f6c6f72\r\n\t]\r\n\t/keyIndex 8\r\n\t/colorIndex 5\r\n\t/isOpen 0\r\n\t/eventCount 1\r\n\t/event-1 {\r\n\t\t/useRulersIn1stQuadrant 0\r\n\t\t/internalName (ai_plugin_setColor)\r\n\t\t/localizedName [ 9\r\n\t\t\t53657420636f6c6f72\r\n\t\t]\r\n\t\t/isOpen 1\r\n\t\t/isOn 1\r\n\t\t/hasDialog 0\r\n\t\t/parameterCount 6\r\n\t\t/parameter-1 {\r\n\t\t\t/key 1768186740\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (ustring)\r\n\t\t\t/value [ 10\r\n\t\t\t\t46696c6c20636f6c6f72\r\n\t\t\t]\r\n\t\t}\r\n\t\t/parameter-2 {\r\n\t\t\t/key 1718185068\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (boolean)\r\n\t\t\t/value 1\r\n\t\t}\r\n\t\t/parameter-3 {\r\n\t\t\t/key 1954115685\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (enumerated)\r\n\t\t\t/name [ 9\r\n\t\t\t\t52474220636f6c6f72\r\n\t\t\t]\r\n\t\t\t/value 2\r\n\t\t}\r\n\t\t/parameter-4 {\r\n\t\t\t/key 1919247406\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value 234.0\r\n\t\t}\r\n\t\t/parameter-5 {\r\n\t\t\t/key 1735550318\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value 10.0\r\n\t\t}\r\n\t\t/parameter-6 {\r\n\t\t\t/key 1651275109\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value 10.0\r\n\t\t}\r\n\t}\r\n}\r\n/action-2 {\r\n\t/name [ 16\r\n\t\t4170706c795374726f6b65436f6c6f72\r\n\t]\r\n\t/keyIndex 0\r\n\t/colorIndex 0\r\n\t/isOpen 1\r\n\t/eventCount 1\r\n\t/event-1 {\r\n\t\t/useRulersIn1stQuadrant 0\r\n\t\t/internalName (ai_plugin_setColor)\r\n\t\t/localizedName [ 9\r\n\t\t\t53657420636f6c6f72\r\n\t\t]\r\n\t\t/isOpen 0\r\n\t\t/isOn 1\r\n\t\t/hasDialog 0\r\n\t\t/parameterCount 6\r\n\t\t/parameter-1 {\r\n\t\t\t/key 1768186740\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (ustring)\r\n\t\t\t/value [ 12\r\n\t\t\t\t5374726f6b6520636f6c6f72\r\n\t\t\t]\r\n\t\t}\r\n\t\t/parameter-2 {\r\n\t\t\t/key 1718185068\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (boolean)\r\n\t\t\t/value 0\r\n\t\t}\r\n\t\t/parameter-3 {\r\n\t\t\t/key 1954115685\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (enumerated)\r\n\t\t\t/name [ 9\r\n\t\t\t\t52474220636f6c6f72\r\n\t\t\t]\r\n\t\t\t/value 2\r\n\t\t}\r\n\t\t/parameter-4 {\r\n\t\t\t/key 1919247406\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value 239.0\r\n\t\t}\r\n\t\t/parameter-5 {\r\n\t\t\t/key 1735550318\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value 34.0\r\n\t\t}\r\n\t\t/parameter-6 {\r\n\t\t\t/key 1651275109\r\n\t\t\t/showInPalette -1\r\n\t\t\t/type (real)\r\n\t\t\t/value 34.0\r\n\t\t}\r\n\t}\r\n}"
);

var tests = [
  {
    contents: JSON.stringify(sampleSet.getJSONSchema()),
    dest: Folder.desktop + "/output.json",
  },
  {
    contents: sampleSet.toAIA(),
    dest: Folder.desktop + "/output.aia",
  },
];

for (var ind = 0; ind < tests.length; ind++) {
  var testCase = tests[ind];
  var tmp = File(testCase.dest);
  tmp.open("w");
  tmp.write(testCase.contents);
  tmp.close();
}
alert("Done");
