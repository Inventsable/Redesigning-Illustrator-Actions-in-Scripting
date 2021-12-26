## Using actions with scripting can be a pain. Exported actions will look like this:

```js
/version 3
/name [ 11
	436f6c6f725069636b6572
]
/isOpen 1
/actionCount 2
/action-1 {
	/name [ 6
		736574524742
	]
	/keyIndex 7
	/colorIndex 2
	/isOpen 0
	/eventCount 1
	/event-1 {
		/useRulersIn1stQuadrant 0
		/internalName (ai_plugin_setColor)
		/localizedName [ 9
			53657420636f6c6f72
		]
		/isOpen 0
		/isOn 1
		/hasDialog 0
		/parameterCount 6
		/parameter-1 {
			/key 1768186740
```

<br/>

### Certain values in the above (with square brackets like `/name` and `/localizedName`) are Hexadecimal to ASCII:

```bash
"436f6c6f725069636b6572"  ==>  "ColorPicker"
"53657420436f6c6f72"      ==>  "Set Color"
"53657420636f6c6f72"      ==>  "Set color"
"46696c6c20636f6c6f72"    ==>  "Fill color"
"52474220636f6c6f72"      ==>  "RGB color"
```

<br/>

### While others like `/key` will be Decimal to Hexadecimal to ASCII:

```bash
"1768186740"  ==>  "idct"
"1718185068"  ==>  "fill"
"1954115685"  ==>  "type"
"1919247406"  ==>  "red."
"1735550318"  ==>  "gren"
"1651275109"  ==>  "blue"
```

<br/>

### To run one without cluttering the user's Actions panel:

```js
// It takes 5 lines just to get the contents and finish with the file
var tmp = File(Folder.desktop + "/someActionSet.aia");
tmp.encoding = "UTF8";
tmp.open("r");
tmp.read();
tmp.close();

// Then we have to load it:
app.loadAction(tmp);

// And remember any hard-coded properties like action name and set name:
app.doScript("export300dpiJPEG", "whateverMySetWasNamed", false);

// Unload and remove the Action set and file from memory
app.unloadAction(setName, "");
```

<br/>

### The above isn't that bad, but it also demonstrates the only 3 interactions that scripting and actions have: whether to load, unload, or execute obscurely formatted text. Actions are a core part of the app to any user so you would think scripting them could be elegant:

```js
// I should be able to load actions easily from a given file:
var mySet = new ActionSet(new File(Folder.desktop + "/someActionSet.aia"));

// And then just run one instantly:
mySet.actions.run("export300dpiJPEG");

// If I want to programmatically load them and expose it to the user:
mySet.load();
```

### Then it should be easy. And if each action were similar to `PageItem`, all their properties would be exposed:

```js
var myExportAction = mySet.actions.getByName("export300dpiJPEG");

alert(myExportAction);
// {
//   events: [{Event ExportAs}, {Event SaveAs}],
//   name: "export300dpiJPEG",
//   parent: [ActionSet SuperUsefuls],
//   typename: "Action",
//   version: 3,
// }
```

### Even to the extent that you could create dynamic actions on the fly:

```js
var myAction = new Action("recolorit");
myAction.events.add(
  new ActionEvent({
    localizedName: "selectAll",
    internalName: "(adobe_selectAll)",
    hasDialog: 0,
  }),
  new ActionEvent({
    localizedName: "paint it red",
    internalName: "(adobe_plugin_setColor)",
    parameters: [
      new ActionParam({ key: "Set color", value: "idct" }),
      new ActionParam({ key: "Fill color", value: "fill" }),
      new ActionParam({ key: "type", value: "RGB color" }),
      new ActionParam({ key: "red.", value: 255 }),
      new ActionParam({ key: "gren", value: 50 }),
      new ActionParam({ key: "blue", value: 0 }),
    ],
  })
);

// {
//   events: [{Event selectAll}, {Event paint-it-red}],
//   name: "recolorit",
//   parent: null,
//   typename: "Action",
//   version: 3,
// }
```

### Then load them into a set and run it:

```js
mySet.actions.add(myAction);
myAction.run();
```

### Or save this new action to a file:

```js

```
