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
      this.raw = aiaText;
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
  createSchema() {
    // Immediately split into Array containing lines
    let lines = this.raw.split(/\r\n/);
    let depthMap = [
      ...new Set(
        lines.filter((a) => /\t/.test(a)).map((i) => i.match(/\t/gm).length)
      ),
    ];
    let maxDepth = Math.max(...depthMap);

    // Instead of treating it like functional data, I want to treat it like a line reader:
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
              // And once more, this is presumably the deepest an AIA data structure will go
              let tempGrandchild = Object.assign({}, grandchild);
              tempGrandchild["children"] = data.filter(
                (i) => i.parent == tempGrandchild.index
              );
              // We should be working with something like ActionSet.action-1.event-1 here
              return tempGrandchild;
            });
          // With this as ActionSet.action-1
          return tempChild;
        });
      // And chain essentially being ActionSet.children, to be unfolded later as a propList
      chain.push(rootGroup);
    }
    this.schema = chain;
    this.data = data;
  }
  convertAIAToJS() {
    return null;
  }
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
