/**
 * I hate working with .aia text. It reminds me of constructing XML strings for CEP context menus,
 * and I love parsing them to JSON for <Menus> in brutalism, so I want to do something similar here.
 *
 * I want to feed .aia text into a Class, then be able to decode all properties and values.
 * I want to further be able to define Actions in an easy way like JSON, and generate .aia text on the fly
 *
 * // ---------------------------------------------------------------------------------- //
 *
 * The real consistency is in formatting, I should be parsing that instead.
 *
 * All you need is the tab-count to build a relational multi-dimensional Array, which solves
 * every recursion and RegEx issue I was having with previous attempts.
 */

class ActionBoy {
  raw = "";
  data = null;
  schema = null;
  value = null;
  constructor(param) {
    if (/string/i.test(param)) {
      this.raw = param;
      this.createSchema();
    } else if (/object/i.test(param)) {
      console.log("Should add Action generation via config object here");
      // I'd need some form of default value lookup to allow user-friendly syntax.
      // Certain parameters in Actions are redundant like action-count and presumably more

      // A lookup is also needed for determining formatting (like "name [ (hex.length/2)\r\n\thex\r\n\t]")
      // and which encoding any given parameter should be given during the .aia generation method
    }
  }
  get schema() {
    return this.createSchema();
  }
  get data() {
    return this.data;
  }
  // This should be called immediately upon any new ActionBoy(aiaText) assignment:
  createSchema() {
    //
    // Immediately split into Array containing lines
    let lines = this.raw.split(/\r\n/);

    // Instead of treating it like functional data to parse out syntax, instead treat it like a line reader:
    let data = lines.map((v, i, a) => {
      // Make an intermediary metadata object about each line including tab depth
      let child = {
        raw: v,
        index: i,
        depth: /\t/.test(v) ? v.match(/\t/gm).length : 0,
        parent: -1,
      };
      let hasBrackets = /[\]\}]/.test(v);

      // If this has a bracket or any tab characters, it must have a parent
      if (child.depth || hasBrackets) {
        // Start reading lines backwards and analyzing each one until finding the parent
        for (let cc = i; !!cc; cc--) {
          let last = a[cc];
          let lastDepth = /\t/.test(last) ? last.match(/\t/gm).length : 0;
          // If the current line is something like "]" or "}", we'll need to find it's opening pair:
          if (hasBrackets) {
            let squareMatch = /\]/.test(v) && /\[/.test(last);
            let curlyMatch = /\}/.test(v) && /\{/.test(last);
            // But it can't be the same pair unless the tab depth is also the same:
            if (child.depth !== lastDepth) continue;
            else if (curlyMatch || squareMatch) {
              // If an open bracket was found crawling backwards and this is the same tab depth,
              // then it must be the opening, right? Way smoother than pure RegEx to parse
              child.parent = cc;
              break;
            } else continue; // If no brace pair in each and same depth, continue reading backwards
          } else if (!hasBrackets && child.depth > lastDepth) {
            // If this doesn't have brackets, we just look for the next line with a lower tab depth
            child.parent = cc;
            break;
          } else continue; // Otherwise keep reading backwards until above conditions are met
        }
      }
      return child;
    });

    // Our relational Array begins as blank, but we need to start with rootProps
    let chain = [];
    let rootProps = data.filter((i) => i.parent < 0); // Anything with default -1 is root

    // So for every root group/property
    for (let cc = 0; cc < rootProps.length; cc++) {
      let propGroup = rootProps[cc];
      let rootGroup = Object.assign({}, propGroup);
      // We clone it, then filter the original array to find all parent/index matches:
      rootGroup["children"] = data
        .filter((i) => i.parent == propGroup.index)
        .map((child) => {
          // And we repeat the exact same process, by cloning all these children:
          let tempChild = Object.assign({}, child);
          // Then looking into the original array for all deeper parent/index matches:
          tempChild["children"] = data
            .filter((i) => i.parent == child.index)
            .map((grandchild) => {
              // Since we have a reliable formatting without dynamic tab-depth, we don't really need recursion.
              // But we will need to travel down to
              let tempGrandchild = Object.assign({}, grandchild);
              tempGrandchild["children"] = data
                .filter((i) => i.parent == tempGrandchild.index)
                .map((greatGrandchild) => {
                  let tempGreatGrandchild = Object.assign({}, greatGrandchild);
                  tempGreatGrandchild["children"] = data.filter(
                    (i) => i.parent == tempGreatGrandchild.index
                  );
                  return tempGreatGrandchild; // This is ActionSet.action-1.event-1.parameter-1
                });
              // We should be working with something like ActionSet.action-1.event-1 here
              return tempGrandchild;
            });
          // With this as ActionSet.action-1
          return tempChild;
        });
      // And chain essentially being ActionSet.children, to be unfolded later as a propList
      chain.push(rootGroup);
    }
    // The above is still sloppy though. It *could* be triggered via depthMap, with item construction done via function

    let finalSchema = sanitizeSchema(chain);

    // Now we can finally use recursion and RegExp:
    let temp = translateSchema(finalSchema);

    // These are placeholder values for now, just want keep each format for demonstration and debugging:
    this.value = temp;
    this.schema = finalSchema;
    this.data = data;
  }
  convertAIAToJS() {
    return null;
  }
}

// We've mapped out the relations between lines, but we still don't have it in the most ideal form.
// We'd want to join any values together instead of keeping them as separate lines, so as an intermediary:
function sanitizeSchema(data) {
  // We shouldn't need all the same data from this point forward, let's trim things down. Start with a new Array
  let temp = [];
  data.forEach((rootPropGroup) => {
    // We'll be replacing parent values with children content and merging lines together,
    // so we should only be concerned about keeping the most basic information:
    let rootClone = {
      depth: rootPropGroup.depth,
      raw: rootPropGroup.raw,
      index: rootPropGroup.index,
    };

    // If this has children, it must be a container object of some sort
    if (rootPropGroup["children"] && rootPropGroup["children"].length) {
      //
      // We need to check if it's deeply nested or shallow (no children contain their own children).
      //
      // If shallow, this would be a value like "/name [ 11 231daf321... ]"
      // If deep, it would be something like "/action { ... }"
      let isDeep = rootPropGroup["children"].filter(
        (i) => i.children && i.children.length
      ).length;

      if (!isDeep) {
        // If value is 0, we're false and shallow. We can merge the children into the parent value:
        rootClone["value"] = `${rootClone.raw}${rootPropGroup.children
          .map((i) => i.raw)
          .join("")}`;

        let str = rootClone.value.trim();
        rootClone["name"] = /\/([^\s]*)/.exec(str)[1];
        str = str.replace(/^\/([^\s]*)/, "").trim(); // This should represent "{ ... }"
        rootClone.value = str;
        // This is still a simplification however, because this may still be something like:
        // "\t\t/parameter-4 {\t\t\t/key 1919247406\t\t\t/showInPalette -1 ... }"
        // It may be an object, but at least we know there aren't conflicts with nested braces.
        if (/\{/.test(rootClone.value) && /\}/.test(rootClone.value)) {
          // So in the case it is a deepnest Object, let's parse it:
          // At this point we can remove the braces:
          //
          rootClone["type"] = "container-B";
          str = str.replace(/^(\{)|(\})$/gm, "").trim();

          // Then we'll do a basic split of the string and try to replicate the schema format:
          rootClone.value = str;
          rootClone["children"] = str.split(/\t{1,}/gm).map((subProp) => {
            let subClone = {
              index: -1,
              depth: rootClone.depth + 1,
              name: subProp.trim().replace(/^\//, "").replace(/\s.*/, ""),
              raw: subProp,
              value: subProp
                .trim()
                .replace(/^\//, "")
                .replace(/^[\s]*/, "")
                .trim(),
            };
            // Suddenly this feels pretty sloppy...
            subClone.value = new RegExp(`^${subClone.name}`).test(
              subClone.value
            )
              ? subClone.value
                  .replace(new RegExp(`^${subClone.name}`), "")
                  .trim()
              : subClone.value;
            if (subClone.value + "" == "null") {
              subClone.value = subProp
                .trim()
                .replace(/^\/[^\s]/, "")
                .trim();
            }

            return subClone;
          });
        } else if (/\[/.test(rootClone.value) && /\]/.test(rootClone.value)) {
          // We know when something is hexadecimal due to the bracket syntax:
          rootClone["type"] = "hexadecimal";
        } else {
          // Nothing should ever reach this
          rootClone["type"] = "undefined-A";
        }
      } else {
        rootClone["name"] = rootClone.raw.trim().replace(/^\//, "");

        rootClone.name = rootClone.name.match(/[^-]*-\d{1,}/)[0];
        // If deep though, we need to recurse inside then merge the shallow children before merging the parent:
        rootClone["type"] = "container-A";
        rootClone["children"] = sanitizeSchema(rootPropGroup.children);
      }
      temp.push(rootClone);
    } else if (/^\t*\/[^\s]*/.test(rootPropGroup.raw)) {
      // This is probably a one-line value:
      rootClone["type"] = "param";
      rootClone["value"] = rootPropGroup.raw.trim();
      if (/\/[^\s]*/.test(rootClone.value))
        rootClone["name"] = /\/([^\s]*)/.exec(rootClone.value)[1];
      else rootClone["name"] = "undefined-B";
      rootClone.value = rootClone.value
        .replace(`\/${rootClone.name}`, "")
        .trim();

      if (/^\d{10}$/.test(rootClone.value)) {
        rootClone["type"] = "decimal";
      }

      temp.push(rootClone);
    } else {
      // This is almost certainly a closing bracket, empty newline, or format artifact with no real value.
      // We don't need this and can ignore it.
    }
  });
  return temp;
}

// This should be simple if we've correctly determined the type above
function sanitizeValue(value, type) {
  let temp = value.trim();
  if (/hex/i.test(type)) {
    temp = value.replace(/(\[|\])/gm, "").trim();
    temp = temp
      .split(/\t{1,}/gm)
      .filter((i, ii) => i.length && ii && /^[a-f0-9]*$/.test(i))
      .join("");
    temp = hexToAscii(temp);
  } else if (/decimal/i.test(type)) {
    temp = decimalToAscii(value);
  } else if (!isNaN(Number(value))) {
    // This is probably an integer of some kind.

    // Since there's a chance a decimal encoded value could reach this (if container-A children),
    // let's check if it matches the canonical 10-length format of AIA decimal encoded values:
    if (/^\d{10}$/.test(temp)) {
      temp = decimalToAscii(temp);
    } else temp = +value; // If it doesn't, let's just convert it to a number
  } else {
    // Chances are this is just a normal string, no need to do anything special
    temp = value;
  }
  return temp;
}

// Now we'll take our schema Array and iterate over it like a propList in order to construct a 1:1 Object representation
function translateSchema(data, depth = 0) {
  // This is rather simple, we need a temporary object
  let result = {};

  // Since we're recusing, we need to have expectations of the data coming in:
  if (data && data.length && Array.isArray(data)) {
    for (let entry of data) {
      // We first check if this is enumerable, like action-1, event-2, parameter-3, etc
      let isEnum = /^\/([^\s-]*)-\d{1,}/;
      if (isEnum.test(entry.raw.trim())) {
        if (entry && entry.name) {
          // Otherwise we trim "-[#]" from the current name and add s:
          let enumName = entry.name.replace(/-.*/, "") + "s";

          // Now we can guarantee that object.actions exists:
          result[enumName] = result[enumName] || [];

          // But if this has children, we recurse deeper
          if (entry.children && entry.children.length)
            result[enumName].push(translateSchema(entry.children, depth + 1));
        } else {
          console.log("Something isn't iterating correctly:");
          result["errorFlags"] = result["errorFlags"] || [];
          result.errorFlags.push(entry);
        }
      } else {
        // Otherwise we can simply pass in the value and type to know how to handle each property:
        result[entry.name] = sanitizeValue(entry.value, entry.type);
      }
    }
  }
  return result;
}

function hexToAscii(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i += 2)
    output += String.fromCharCode(parseInt(input.toString().substr(i, 2), 16));
  return output;
}

function asciiToHex(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i++)
    output += input.toString().charCodeAt(i).toString(16);
  return output;
}

function decimalToAscii(input) {
  return hexToAscii(Number((input + "").trim()).toString(16));
}

function asciiToDecimal(input) {
  return parseInt(asciiToHex(input), 16);
}

module.exports = ActionBoy;
