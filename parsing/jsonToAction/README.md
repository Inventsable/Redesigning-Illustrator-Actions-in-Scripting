# Converting JSON to AIA

### My first thought is passing each key/value pair into some kind of diagnostic function:

```js
// This is either extremely clever or needlessly obtuse
function hasConditionalFormatting(key, value, depth, parent) {
  // The idea is to re-evaluate several edge cases against the current key/value:
  let conditions = {
    // If an enumerable, we have to recurse into it's children
    isEnum: [() => ["actions", "events", "parameters"].includes(key)],
    // If a hex, we'll have to encode it then format it very strictly:
    isHex: [
      () => ["name", "localizedName"].includes(key), // Certain keys might always qualify as hex
      () =>
        key == "value" &&
        parent["type"] &&
        ["(ustring)"].includes(parent["type"]), // But some might depend on a sibling property
    ],
    // Decimal encoding has predictable keys:
    isDec: [() => depth > 2 && ["key"].includes(key)],
    // If a particular "real" int type, it should have a floating point in the AIA value:
    isReal: [
      () =>
        key == "value" &&
        parent["type"] &&
        /real/i.test(parent["type"]) &&
        !/\./.test(value),
    ],
  };
  // So we remap an array of keys from the above object:
  let diagnostic = Object.keys(conditions)
    .map((k) => {
      // Into a unique collection (cannot contain duplicate values)
      return [
        ...new Set(
          conditions[k]
            // Of calling each function and evaluating the condition
            .map((func) => {
              // In which case we assign the value to the key (condition type)
              return func(...arguments) ? k : false;
            })
            // Then remove any empty values when edge cases weren't met
            .filter((i) => i && i.length)
        ),
      ];
    })
    .flat()
    .filter((i) => i); // Then collapse an Array of Arrays into a single Array, removing empties

  // With specific enough conditions, only one of the below should be returning true:
  return {
    isEnum: diagnostic.includes("isEnum"),
    isHex: diagnostic.includes("isHex"),
    isDec: diagnostic.includes("isDec"),
    isReal: diagnostic.includes("isReal"),
    isNone: !diagnostic.length,
  };
}
```

<br />

### If the above catches any time special formatting is needed, we can recurse through each object and print as we go:

```js
// If we write one good enough function to print lines in AIA format,
// we can recurse inside any enumerables like actions/events/parameters:
function unfoldPerDepth(obj, str = "", depth = 0, parent = null) {
  // The recursion depth is the same as our leading \t characters:
  let padding = "".padStart(depth, "\t");

  // Iterate over the properties of this object as if it were an Array:
  Object.keys(obj).forEach((key, mainIndex) => {
    // Our handler function from above:
    let conditions = hasConditionalFormatting(key, obj[key], depth, obj);
    //
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
```

---

<br />

## Result

<table cellpadding="0" cellspacing="0" border="2" style="width: 1000px;">
  <tr>
    <td>
      <strong>INPUT - ../actionsToJSON/input.aia</strong>
    </td>
    <td>
      <strong>OUTPUT - ./output.aia</strong>
    </td>
  </tr>
  <tr style="height:800px; width:1000px; margin:0; padding: 0;">
    <td style="height: 800px; width:500px; margin:0; padding: 0;">
      <pre style="height: 800px; width:500px; margin:0; padding: 0;">
<code style="height: 800px; width:500px; margin:0; padding: 0;">/version 3
/name [ 9
	73616d706c65536574
]
/isOpen 1
/actionCount 4
/action-1 {
	/name [ 15
		4170706c792052656420436f6c6f72
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
	/name [ 8
		7361766546696c65
	]
	/keyIndex 0
	/colorIndex 0
	/isOpen 0
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (adobe_saveDocumentAs)
		/localizedName [ 7
			53617665204173
		]
		/isOpen 0
		/isOn 1
		/hasDialog 1
		/showDialog 0
		/parameterCount 11
		/parameter-1 {
			/key 1668116594
			/showInPalette -1
			/type (boolean)
			/value 1
		}
		/parameter-2 {
			/key 1885627936
			/showInPalette -1
			/type (boolean)
			/value 1
		}
		/parameter-3 {
			/key 1668445298
			/showInPalette -1
			/type (integer)
			/value 24
		}
		/parameter-4 {
			/key 1702392878
			/showInPalette -1
			/type (integer)
			/value 1
		}
		/parameter-5 {
			/key 1768842092
			/showInPalette -1
			/type (integer)
			/value 0
		}
		/parameter-6 {
			/key 1918989423
			/showInPalette -1
			/type (real)
			/value 100.0
		}
		/parameter-7 {
			/key 1886545516
			/showInPalette -1
			/type (integer)
			/value 1
		}
		/parameter-8 {
			/key 1936548194
			/showInPalette -1
			/type (boolean)
			/value 0
		}
		/parameter-9 {
			/key 1851878757
			/showInPalette -1
			/type (ustring)
			/value [ 84
				433a5c55736572735c54525363685c417070446174615c526f616d696e675c41
				646f62655c4345505c657874656e73696f6e735c6c6f676f2d7061636b616765
				2d736b657463682d686f73745c73616e64626f78
			]
		}
		/parameter-10 {
			/key 1718775156
			/showInPalette -1
			/type (ustring)
			/value [ 35
				41646f626520496c6c7573747261746f7220416e7920466f726d617420577269
				746572
			]
		}
		/parameter-11 {
			/key 1702392942
			/showInPalette -1
			/type (ustring)
			/value [ 6
				61692c616974
			]
		}
	}
}
/action-3 {
	/name [ 8
		6d616b6552656374
	]
	/keyIndex 0
	/colorIndex 0
	/isOpen 0
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (ai_plugin_rectTool)
		/localizedName [ 14
			52656374616e676c6520546f6f6c
		]
		/isOpen 0
		/isOn 1
		/hasDialog 1
		/showDialog 0
		/parameterCount 6
		/parameter-1 {
			/key 1953460076
			/showInPalette -1
			/type (integer)
			/value 15
		}
		/parameter-2 {
			/key 2003072104
			/showInPalette -1
			/type (unit real)
			/value 1377.0
			/unit 592476268
		}
		/parameter-3 {
			/key 1751607412
			/showInPalette -1
			/type (unit real)
			/value 997.0
			/unit 592476268
		}
		/parameter-4 {
			/key 1668182644
			/showInPalette -1
			/type (boolean)
			/value 0
		}
		/parameter-5 {
			/key 1668183128
			/showInPalette -1
			/type (unit real)
			/value 1050.5
			/unit 592476268
		}
		/parameter-6 {
			/key 1668183129
			/showInPalette -1
			/type (unit real)
			/value 1861.5
			/unit 592476268
		}
	}
}
/action-4 {
	/name [ 9
		72756e536372697074
	]
	/keyIndex 0
	/colorIndex 0
	/isOpen 1
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (adobe_commandManager)
		/localizedName [ 16
			416363657373204d656e75204974656d
		]
		/isOpen 0
		/isOn 1
		/hasDialog 0
		/parameterCount 2
		/parameter-1 {
			/key 1769238125
			/showInPalette -1
			/type (ustring)
			/value [ 17
				5f30303030303234443346443346344230
			]
		}
		/parameter-2 {
			/key 1818455661
			/showInPalette -1
			/type (ustring)
			/value [ 10
				74657374536372697074
			]
		}
	}
}
        </code>
      </pre>    
    </td>
    <td style="height: 800px; width:500px; margin:0; padding: 0;">
      <pre style="height: 800px; width:500px; margin:0; padding: 0;">
<code style="height: 800px; width:500px; margin:0; padding: 0;">/version 3
/name [ 9
	73616d706c65536574
]
/isOpen 1
/actionCount 4
/action-1 {
	/name [ 15
		4170706c792052656420436f6c6f72
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
	/name [ 8
		7361766546696c65
	]
	/keyIndex 0
	/colorIndex 0
	/isOpen 0
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (adobe_saveDocumentAs)
		/localizedName [ 7
			53617665204173
		]
		/isOpen 0
		/isOn 1
		/hasDialog 1
		/showDialog 0
		/parameterCount 11
		/parameter-1 {
			/key 1668116594
			/showInPalette -1
			/type (boolean)
			/value 1
		}
		/parameter-2 {
			/key 1885627936
			/showInPalette -1
			/type (boolean)
			/value 1
		}
		/parameter-3 {
			/key 1668445298
			/showInPalette -1
			/type (integer)
			/value 24
		}
		/parameter-4 {
			/key 1702392878
			/showInPalette -1
			/type (integer)
			/value 1
		}
		/parameter-5 {
			/key 1768842092
			/showInPalette -1
			/type (integer)
			/value 0
		}
		/parameter-6 {
			/key 1918989423
			/showInPalette -1
			/type (real)
			/value 100.0
		}
		/parameter-7 {
			/key 1886545516
			/showInPalette -1
			/type (integer)
			/value 1
		}
		/parameter-8 {
			/key 1936548194
			/showInPalette -1
			/type (boolean)
			/value 0
		}
		/parameter-9 {
			/key 1851878757
			/showInPalette -1
			/type (ustring)
			/value [ 84
				433a5c55736572735c54525363685c417070446174615c526f616d696e675c41
				646f62655c4345505c657874656e73696f6e735c6c6f676f2d7061636b616765
				2d736b657463682d686f73745c73616e64626f78
			]
		}
		/parameter-10 {
			/key 1718775156
			/showInPalette -1
			/type (ustring)
			/value [ 35
				41646f626520496c6c7573747261746f7220416e7920466f726d617420577269
				746572
			]
		}
		/parameter-11 {
			/key 1702392942
			/showInPalette -1
			/type (ustring)
			/value [ 6
				61692c616974
			]
		}
	}
}
/action-3 {
	/name [ 8
		6d616b6552656374
	]
	/keyIndex 0
	/colorIndex 0
	/isOpen 0
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (ai_plugin_rectTool)
		/localizedName [ 14
			52656374616e676c6520546f6f6c
		]
		/isOpen 0
		/isOn 1
		/hasDialog 1
		/showDialog 0
		/parameterCount 6
		/parameter-1 {
			/key 1953460076
			/showInPalette -1
			/type (integer)
			/value 15
		}
		/parameter-2 {
			/key 2003072104
			/showInPalette -1
			/type (unit real)
			/value 1377.0
			/unit 592476268
		}
		/parameter-3 {
			/key 1751607412
			/showInPalette -1
			/type (unit real)
			/value 997.0
			/unit 592476268
		}
		/parameter-4 {
			/key 1668182644
			/showInPalette -1
			/type (boolean)
			/value 0
		}
		/parameter-5 {
			/key 1668183128
			/showInPalette -1
			/type (unit real)
			/value 1050.5
			/unit 592476268
		}
		/parameter-6 {
			/key 1668183129
			/showInPalette -1
			/type (unit real)
			/value 1861.5
			/unit 592476268
		}
	}
}
/action-4 {
	/name [ 9
		72756e536372697074
	]
	/keyIndex 0
	/colorIndex 0
	/isOpen 1
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (adobe_commandManager)
		/localizedName [ 16
			416363657373204d656e75204974656d
		]
		/isOpen 0
		/isOn 1
		/hasDialog 0
		/parameterCount 2
		/parameter-1 {
			/key 1769238125
			/showInPalette -1
			/type (ustring)
			/value [ 17
				5f30303030303234443346443346344230
			]
		}
		/parameter-2 {
			/key 1818455661
			/showInPalette -1
			/type (ustring)
			/value [ 10
				74657374536372697074
			]
		}
	}
}
        </code>
      </pre>    
    </td>
  </tr>
</table>
