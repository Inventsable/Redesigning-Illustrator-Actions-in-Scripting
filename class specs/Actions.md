# **class** Actions

### **Properties**

| Property | Type        |                           Description |
| :------- | :---------- | ------------------------------------: |
| length   | `Number`    | Number of elements in this collection |
| parent   | `ActionSet` |    This object's container, if exists |
| typename | `String`    |            Returns `ActionCollection` |

`Actions` is an Array-like, it's value should be `[]` when constructed then used as a container for `Action` objects. Contents would be accessed via `Action.actions[0]` and any other indices.

### **Methods**

<dl>
<dt><a href="#a">add(action)</a> ⇒ <code>null</code></dt>
<dd><p>Push a new action object into this collection</p>
</dd>
<dt><a href="#a">getByName(name)</a> ⇒ <code>Action | null</code></dt>
<dd><p>Returns action by name of query string. If action of this name doesn't exist, returns null.</p>
</dd>
<dt><a href="#a">index(i)</a> ⇒ <code>Action</code></dt>
<dd><p>An alternate to [index] syntax to be consistent with Adobe (e.g. PathItems, PluginItems, etc)</p>
</dd>
<dt><a href="#a">remove(actionName)</a> ⇒ <code>Boolean</code></dt>
<dd><p>Removes action if found, returns true if successful and false if not found.</p>
</dd>
</dl>

---

## constructor(values):

| Property | Type    | Default |                Description |
| :------- | :------ | :------ | -------------------------: |
| values   | `Array` | []      | Array of `Action` elements |

```js
var setColor = new Action(); // this is placeholder content
var makeSquare = new Action();

var actions = new Actions([setColor, makeSquare]);
// This is largely redundant because we won't have to manually create Actions, Events, or Parameters when feeding .aia rawtext in.

// If you want to add actions manually, it would be done either above or below this:

var mySet = new ActionSet(new File("~/desktop/sampleActions.aia"));
var newAction = new Action(); // again null, could be constructed legitimately

mySet.actions.add(newAction); // This is the same as the above, since Action.actions will be generated automatically when creating a set.
```

---

## **Methods**

## **add**(action) => `Boolean`

Push a new action object into this collection, identical to `Array.push()`.

```js
// Loading a set will construct the actions present dynamically:
var mySet = new ActionSet(new File("~/desktop/someFile.aia"));
alert(mySet.actions[0].name); // Returns "someTestAction", since it was constructed by the set

// To add a new action, we'd need basic information and to fill the remainder with defaults:
var myAction = new Action({
  name: "openColorPicker",
  isOpen: false,
  events: ...
  ...
});

// Then add this action to the set:
mySet.actions.add(myAction);
// So we can execute it or save it later
```

## **getByName**(name) => `Action` | `null`

Returns action by name of query string. If action of this name doesn't exist, returns null.

```js
var mySet = new ActionSet("~/desktop/sampleActions.aia");

var setColor = mySet.actions.getByName("setColor");
var export300 = mySet.actions.getByName("export300dpiJPEG");

setColor.run(); // Action is executed
export300.run(); // Action is executed
```

## **index**(num) => `Action` | `null`

An alternate to square bracket syntax to be consistent with Adobe (e.g. in use in other Array-likes: PathItems, PluginItems, etc).

```js
var mySet = new ActionSet("~/desktop/sampleActions.aia");

var setColor = mySet.actions.index(1);
// The above is identical to:
var setColor = mySet.actions[1];
```

## **remove**(name) => `Boolean`

Removes action if found, returns true if successful and false if not found.

```js
var mySet = new ActionSet("~/desktop/sampleActions.aia");

alert(mySet.actions.length); // 3

mySet.actions.remove("export300dpiJPEG");
alert(mySet.actions.length); // 2
```
