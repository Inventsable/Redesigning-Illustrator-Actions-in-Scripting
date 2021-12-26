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
// We have to manually grab the contents of the file
var tmp = File(Folder.desktop + "/someActionSet.aia");
tmp.encoding = "UTF8";
tmp.open("r");
tmp.read();

// Then load it and close the file:
app.loadAction(tmp);
tmp.close();

// While remembering any hard-coded values like action name and set name:
app.doScript("export300dpiJPEG", "whateverMySetWasNamed", false);

// And when done, unload whatever temporary set we'd made:
app.unloadAction("whateverMySetWasNamed", "");
```

<br/>

### The above isn't that bad or inconvenient, but it demonstrates the only 3 interactions that scripting and actions have: whether to load, unload, or execute obscurely formatted text. Actions are a core part of the app to any user so you would think scripting them could be a lot more elegant:

```js
// I should be able to load actions easily from a given file:
var mySet = new ActionSet(new File(Folder.desktop + "/someActionSet.aia"));

// And then just run one instantly:
mySet.actions.run("export300dpiJPEG");

// If I want to load them and save this set for the user:
mySet.load(); // it should be this easy
```

<br/>

### And if each action were similar to `PageItem`, all their properties would be exposed:

```js
var myExportAction = mySet.actions.getByName("export300dpiJPEG");
```

```js
myExportAction: {
  "events": [[Event ExportAs], [Event SaveAs]],
  "name": "export300dpiJPEG",
  "parent": [ActionSet SuperUsefuls],
  "typename": "Action",
  "version": 3,
}
```

<br/>

### Which could allow you to create dynamic actions on the fly:

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
```

```js
myAction: {
  "events": [[Event selectAll], [Event paint-it-red]],
  "name": "recolorit",
  "parent": null,
  "typename": "Action",
  "version": 3,
}
```

<br/>

### Add them into any set and run it:

```js
mySet.actions.add(myAction);
myAction.run();
```

<br/>

### Then save this new action set to a file:

```js
mySet.saveAs(new File("~/desktop/setColorSet.aia"));
```

<br/>

### But if we're parsing AIA anyway, we could use JSON instead:

```js
mySet.saveAs(new File("~/desktop/setColorSet.json"));
```

<br/>

### To become more legible and transparent for all parties involved:

```json
{
  "name": "SuperUsefuls",
  "isOpen": 1,
  "actions": [
    {
      "name": "recolorit",
      "events": [
        {
          "localizedName": "selectAll",
          "internalName": "(adobe_selectAll)",
          "hasDialog": 0
        },
        {
          "localizedName": "paint it red",
          "internalName": "(adobe_plugin_setColor)",
          "parameters": [
            { "key": "Set color", "value": "idct" },
            { "key": "Fill color", "value": "fill" },
            { "key": "type", "value": "RGB color" },
            { "key": "red.", "value": 255 },
            { "key": "gren", "value": 50 },
            { "key": "blue", "value": 0 }
          ]
        }
      ]
    }
  ]
}
```

---

<br/>
<br/>

## And that's the idea.

But maybe it's worth trying to design code instead of always jumping in and improvising, so I'm writing out what feels right.

<br/>
<br/>

## **ActionSet**

### Properties

| Key      | Type      |                                                                                                                                         Description |
| :------- | :-------- | --------------------------------------------------------------------------------------------------------------------------------------------------: |
| actions  | `Actions` | Array-like collection of `Action` objects. Entries can be accessed as an Array while simultaneously having functions like `ActionSet.actions.add()` |
| loaded   | `Boolean` |                                                                                                      Whether or not the current set has been loaded |
| name     | `String`  |                                                                                                                         The name of the current set |
| rawtext  | `String`  |                                                                      Text last used to generate this object on creation or `ActionSet.toAIA()` call |
| typename | `String`  |                                                                                                                               Returns `"ActionSet"` |

<br/>

### Methods

<dl>
<dt><a href="#load">ActionSet.load()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Load the current set into memory, equivalent to <code>Application.loadAction</code>. Returns truthiness of whether successful.</p>
</dd>
<dt><a href="#a">ActionSet.run([actionName?])</a> ⇒ <code>Boolean</code></dt>
<dd><p>Run <code>Action</code> contained in current set by name. Returns truthy if successful, falsey if no <code>Action</code> of this name is found.</p>
</dd>
<dt><a href="#a">ActionSet.saveAs(file)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Saves current set to designated file. Returns truthiness of whether or not successful.</p>
</dd>
<dt><a href="#a">ActionSet.toAIA()</a> ⇒ <code>String</code></dt>
<dd><p>Converts this set's content to dynamically generated AIA text.</p>
</dd>
<dt><a href="#a">ActionSet.toJSON()</a> ⇒ <code>String</code></dt>
<dd><p>Converts this set's content to dynamically generated JSON text.</p>
</dd>
<dt><a href="#a">ActionSet.unload</a> ⇒ <code>Boolean</code></dt>
<dd><p>Unloads the current ActionSet into memory, equivalent to <code>Application.unloadAction</code>.</p>
</dd>
</dl>

<br />

## **Action**

### Properties

| Key      | Type                  |                                                                                                                                                  Description |
| :------- | :-------------------- | -----------------------------------------------------------------------------------------------------------------------------------------------------------: |
| events   | `Events`              |                 Array-like collection of `Event` objects. Entries can be accessed by index while simultaneously including methods like `Action.events.add()` |
| isOpen   | `Boolean`             |                                                                                                                        Whether unfolded in the Actions panel |
| name     | `String`              |                                                                                                                                          Name of this action |
| parent   | `ActionSet` \| `null` | The set containing this action (if any). This prop is rewritten each time this action is exposed to an `ActionSet.actions` method like `add()` or `remove()` |
| typename | `String`              |                                                                                                                                           Returns `"Action"` |
| version  | `Number`              |                                                                                                                                              Defaults to `3` |

<br />

### Methods

<dl>
<dt><a href="#a">Action.load()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Loads current action into memory, must be included inside valid ActionSet. Returns boolean of whether successful</p>
</dd>
<dt><a href="#a">Action.remove()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Removes current action within set (if any). Returns boolean of whether successful</p>
</dd>
<dt><a href="#a">Action.run()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Executes current action, must be included inside valid ActionSet. Returns boolean of whether successful</p>
</dd>
<dt><a href="#a">Action.unload()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Unloads current action into memory, must be included inside valid ActionSet. Returns boolean of whether successful</p>
</dd>
</dl>
