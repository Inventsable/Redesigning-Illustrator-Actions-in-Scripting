## My first instinct for parsing this:

```bash
/version 3
/name [ 11
	436f6c6f725069636b6572
]
/isOpen 1
/actionCount 1
/action-1 {
	/name [ 3
		736574
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
```

<br />

### Or any other text is through RegExp. At least here you could split them into root properties, then recurse inside each and analyze one nesting depth at a time. Maybe I could be super clever about it:

```js
// If I made a good enough function that processes blocks of text at a time, it could be recursive
function scanAll(text, main = {}, depth = 0) {
  // If it has a depth value it's already recursing, so you could slice off the first tab of each newline at the beginning:
  if (depth) text = text.replace(/^\t{1}/gm, "");

  // Now all root props have no tabs and start with the / character:
  let propRX = /^(?!\s|\]|\}).{1,}/gm,
    propList = text.match(propRX);

  // So we create some variables to keep count of values and the prop index
  let temp = [],
    i = -1;
  // Loop through each match from RegExp
  for (const prop of propList) {
    // Try to match the name and update the index
    let name = prop.match(/\/([^\s]*)/)[0].replace(/^\//, "");
    i++;

    // Then check if this prop is enumerable, like action-1 or event-4
    let isEnum = !/^[^-]*$/gm.test(prop);
    if (!isEnum) {
      // If not, try to identify whether it's a direct value or something to be decoded
      if (new RegExp(`^\\/${name}\\s\\d`).test(prop)) {
        let res = prop.replace(new RegExp(`^\\/${name}\\s*`), "");
        main[name] = +res.trim();
      } else {
        // This is a string, probably with brackets? I'll have to merge the other half of it before I get to this point, come to think of it
        main[name] = "";
      }
    } else {
      // But if it's enumerable that's easy, get the key:
      let enumKey = `${name.match(/([^-])*/)[0]}s`;

      // And if we don't already have actions or events in the object we're creating, make it:
      main[enumKey] = main[enumKey] || [];

      // Then recurse into here
      main[enumKey].push(scanAll(text, {}, depth + 1));
    }
  }
  return main;
}
```

<br />

### But it gets out of hand immediately when you recurse. Matching bracket pairs with RegExp accurately is tricky enough and it breaks when encountering any new/unknown syntax -- either bulletproof or completely broken.

### To really parse something I'd have to split it into lines, then process them in sequence:

```js
[
  "/version 3",
  "/name [ 11",
  "\t436f6c6f725069636b6572",
  "]",
  "/isOpen 1",
  "/actionCount 1",
  "/action-1 {",
  "\t/name [ 4",
  "\t\t54657374",
  "\t]",
  "\t/keyIndex 0",
  "\t/colorIndex 0",
  "\t/isOpen 1",
  "\t/eventCount 3",
  "\t/event-1 {",
  "\t\t/useRulersIn1stQuadrant 0",
  "\t\t/internalName (ai_plugin_rectTool)",
  "\t\t/localizedName [ 14",
  "\t\t\t52656374616e676c6520546f6f6c",
  "\t\t]",
];
```

<br />

### And if it's consistently formatted, we can parse the formatting of tabs alone to skip any need for complicated RegExp or recursion at all. We hardly have to care about the syntax at all because it's far simpler:

```json
"/name [ 11",  // <= any line without \t is a root property

"\t436f6c6f725069636b6572",  // <= any line with \t must have a parent line

"]",  // <= any closing bracket/brace must have a parent line
```

<br />

### And you can just loop backwards from the current line until you find one with less tab characters than the current (or the same in the case of closing brackets/braces). You could map out the relations between lines first and properly nest them:

```js
function createSchema(rawtext) {
  // Immediately split into Array containing lines
  let lines = rawtext.split(/\r\n/);

  // We can iterate in sequence like a Line Reader
  let data = lines.map((v, i, a) => {
    // v:value, i:index, a:array
    // Make an intermediary metadata object about each line including tab depth
    let child = {
      raw: v,
      index: i,
      depth: /\t/.test(v) ? v.match(/\t/gm).length : 0, // Depth is just \t count
      parent: -1, // We want to assign an impossible index first, then match afterwards
    };

    // If this has a bracket or any tab characters, it must have a parent
    let hasClosingBrackets = /[\]\}]/.test(v);
    if (child.depth || hasClosingBrackets) {
      // Start reading lines backwards and analyzing each one until finding the parent
      for (let cc = i; !!cc; cc--) {
        // Start from index, don't be zero, count down

        // We need to take a good look at the last line
        let last = a[cc];
        let lastDepth = /\t/.test(last) ? last.match(/\t/gm).length : 0;

        // If the current line is something like "]" or "}", we'll need to find it's opening pair:
        if (hasClosingBrackets) {
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
        } else if (!hasClosingBrackets && child.depth > lastDepth) {
          // If this doesn't have brackets, we just look for the next line with a lower tab depth
          child.parent = cc;
          break;
        } else continue; // Otherwise keep reading backwards until above conditions are met
      }
    }
    return child; // And we're done
  });
}
```

<br />

### Now we have a very interesting way of working with the data:

```js
// Our relational Array begins as blank, but we need to start with rootProps
let chain = [];

// Parents were always found and assigned accurately, so any -1 is a root line:
let rootProps = data.filter((i) => i.parent < 0);

// So for every root group/property
for (let cc = 0; cc < rootProps.length; cc++) {
  let propGroup = rootProps[cc];

  // We clone it first
  let rootGroup = Object.assign({}, propGroup);

  // It's children are any line where the parent prop matches the current index:
  rootGroup["children"] = data
    .filter((i) => i.parent == propGroup.index)
    .map((child) => {
      //
      // And we repeat the exact same process, by cloning all these children:
      let tempChild = Object.assign({}, child);
      //
      // Then looking into the original array for all deeper parent/index matches:
      tempChild["children"] = data
        .filter((i) => i.parent == child.index)
        .map((grandchild) => {
          //
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
```

</br>

### All lines are properly parsed into their parent regardless of the syntax:

```json
[
  {
    "raw": "/version 3",
    "index": 0,
    "depth": 0,
    "parent": -1,
    "children": []
  },
  {
    "raw": "/name [ 11",
    "index": 1,
    "depth": 0,
    "parent": -1,
    "children": [
      {
        "raw": "\t436f6c6f725069636b6572",
        "index": 2,
        "depth": 1,
        "parent": 1,
        "children": []
      },
      {
        "raw": "]",
        "index": 3,
        "depth": 0,
        "parent": 1,
        "children": []
      }
    ]
  },
  {
    "raw": "/isOpen 1",
    "index": 4,
    "depth": 0,
    "parent": -1,
    "children": []
  }
]
```

<br />

### Now to begin decoding
