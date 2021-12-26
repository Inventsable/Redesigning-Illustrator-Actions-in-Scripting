# **class** ActionSet

This is the main goal. An easy-to-use container of .aia text as a comprehensive, Adobe-like and native-feeling object.

### **Properties**

| Property | Type      |                                                                                                                                         Description |
| :------- | :-------- | --------------------------------------------------------------------------------------------------------------------------------------------------: |
| actions  | `Actions` | Array-like collection of `Action` objects. Entries can be accessed as an Array while simultaneously having functions like `ActionSet.actions.add()` |
| loaded   | `Boolean` |                                                                                                      Whether or not the current set has been loaded |
| name     | `String`  |                                                                                                                         The name of the current set |
| rawtext  | `String`  |                                                                      Text last used to generate this object on creation or `ActionSet.toAIA()` call |
| typename | `String`  |                                                                                                                               Returns `"ActionSet"` |

### **Methods**

<dl>
<dt><a href="#load">load()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Load the current set into memory, equivalent to <code>Application.loadAction</code>. Returns truthiness of whether successful.</p>
</dd>
<dt><a href="#a">run([actionName?])</a> ⇒ <code>Boolean</code></dt>
<dd><p>Run <code>Action</code> contained in current set by name. Returns truthy if successful, falsey if no <code>Action</code> of this name is found.</p>
</dd>
<dt><a href="#a">saveAs(file)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Saves current set to designated file. Returns truthiness of whether or not successful.</p>
</dd>
<dt><a href="#a">toAIA()</a> ⇒ <code>String</code></dt>
<dd><p>Converts this set's content to dynamically generated AIA text.</p>
</dd>
<dt><a href="#a">toJSON()</a> ⇒ <code>String</code></dt>
<dd><p>desc</p>
</dd>
<dt><a href="#a">unload</a> ⇒ <code>Boolean</code></dt>
<dd><p>Unloads the current ActionSet into memory, equivalent to <code>Application.unloadAction</code>.</p>
</dd>
</dl>

---

## constructor(config):

| Property | Type                           | Default |                                                                                                              Description |
| :------- | :----------------------------- | :------ | -----------------------------------------------------------------------------------------------------------------------: |
| config   | `File` \| `String` \| `Object` | `null`  | String of .aia rawtext, any .aia File or String path to one, an `ActionBoy` Object or `ActionSet.toJSON()` output String |

```js
// New set from File:
var aiaFile = new File("~/desktop/sampleActions.aia");
var mySet = new ActionSet(aiaFile);

// New set from filepath String:
var mySet = new ActionSet("~/desktop/sampleActions.aia"); // as filepath

// New set from AIA rawtext:
var myFile = new File("~/desktop/sampleActions.aia");
myFile.encoding = "UTF8";
myFile.open("r");
var mySet = new ActionSet(myFile.read());

// New set from JSON String:
function callbackFromCEP(jsonString) {
  var mySet = new ActionSet(jsonString);
  // ActionSet can export to JSON and a user might prefer to keep .json files over .aia files.
}

// New set ActionBoy Object:
function callbackFromCEP(jsonString) {
  // ActionBoy isn't finished but this would be a good thing to include regardless.
  var mySet = new ActionSet(JSON.parse(jsonString));
  // This wouldn't be a normal JSON, it would be a shorthand one that fills missing params to default for given events
}
```

---

## **Methods**

## **load**( ) => `Boolean`

Load the current ActionSet into memory, equivalent to `Application.loadAction`.

```js
var mySet = new ActionSet("~/desktop/sampleActions.aia");
mySet.load();
// mySet now appears in Actions menu and can be accessed by user

var corruptedData = new ActionSet("~/desktop/sampleActions.aia");
var status = mySet.load();
alert(Status.error); // false, something went wrong. The application refused the load, we see the error message here
```

## **run**(actionName) => `Boolean`

Run `Action` contained in current `ActionSet` by name. Returns truthy if successful, falsey if unsuccessful (if `Action` of name "\_\_\_\_" is not found).

| Param      | Type     | Default |                                           Description |
| :--------- | :------- | :------ | ----------------------------------------------------: |
| actionName | `String` |         | The name of the `Action` to target within current Set |

```js
// Get a new set from any given file, then run one of the actions:
var mySet = new ActionSet("~/desktop/sampleActions.aia");
mySet.load(); // Technically actions must be loaded before execution. Should probably load them each invocation of run() in case they've been modified, though.
var status = mySet.run("export300dpiJPEG"); // Running the "export300dpiJPEG" Action in current set

if (status) alert("Done!");
else alert("Something went wrong, name was probably incorrect.");

// This is equivalent to:
var exportAction = mySet.actions.getByName("export300dpiJPEG");
exportAction.run();
```

## **saveAs**(file) => `Boolean`

Saves current set to designated file.

| Param | Type   | Default |                             Description |
| :---- | :----- | :------ | --------------------------------------: |
| file  | `File` |         | File object associated with destination |

```js
// The set needs to be previously instantiated:
var mySet = new ActionSet("~/desktop/sampleActions.aia");

// But can be re-saved to any new location:
mySet.saveAs(new File("~/desktop/newFileLocation.aia"));

// This is equivalent to:
var text = mySet.toAIA(); // or if unmodified since creation, mySet.raw property
var target = new File("~/desktop/newFileLocation.aia"); // create the file ref
target.open("w"); // open it for writing
target.write(text); // write aia rawtext inside
target.close(); // close the file for writing

// ^ The major difference would be convenience, since we can use the file extension to know how to write it.
// The above could also see a .json extension in the file, then use mySet.toJSON() as var text assignment instead.
```

## **toAIA**( ) => `String`

Converts current `ActionSet` to dynamically generated AIA text. Since the premise of this class is to make actions and sets dynamic, we want the ability to modify them freely and generate text compatible with the app to load.

```js
// Creating a new set, removing an action from it, then getting the result as AIA:
var mySet = new ActionSet("~/desktop/sampleActions.aia");
mySet.actions.remove("export300dpiJPEG");
var newString = mySet.toAIA(); // Newly generated text excluding action removed above.
// This method needs to be run internally before any kind of load/preload action, but should still be exposed to the user.
```

## **toJSON**( ) => `String`

Converts current `ActionSet` to dynamically generated JSON text. This includes decoding all AIA parameters from decimal and hexadecimal formats, making AIA text human readable by transforming values like `"52474220636f6c6f72"` to `"RGB Color"`.

```js
// Creating a new set, removing an action from it, then getting the result as JSON:
var mySet = new ActionSet("~/desktop/sampleActions.aia");
mySet.actions.remove("export300dpiJPEG");
var newSetJSONString = mySet.toJSON();

// The below is redundant:
var target = new File("~/desktop/newFileLocation.json");
target.open("w");
target.write(newSetJSONString);
target.close();

// Because there's already a shorthand to do so:
mySet.saveAs(new File("~/desktop/newFileLocation.json"));
// Still a good idea to allow a user to access the JSON content for their own needs though.
```

## **unload**([actionName]) => `Boolean`

Unloads the current ActionSet into memory, equivalent to `Application.unloadAction`.

| Param      | Type     | Default |                                                      Description |
| :--------- | :------- | :------ | ---------------------------------------------------------------: |
| actionName | `String` | `null`  | Name of `Action` to unload. If blank, unloads entire `ActionSet` |

```js
// Unloading entire set from Actions panel:
mySet.unload();

// Reloading entire set:
mySet.load();

alert(mySet.actions.length); // 3
mySet.unload("export300dpiJPEG"); // This action is no longer available in Actions panel
alert(mySet.actions.length); // 3
// Why still 3? Because unloading an action is removing it from the UI. To remove an action from the class set itself, we follow Parent.Children (Document.PageItems) convention:

mySet.actions.remove("export300dpiJPEG");
alert(mySet.actions.length); // 2
```
