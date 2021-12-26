# **class** Action

In terms of properties this should be a 1:1 JSON equivalent of aia rawtext. This should also make it possible to construct an Action dynamically though, adding it to a set at a later point. Unfortunately since the app considers actions in terms of sets and never individually, you must assign it to a set before being able to run or execute it.

### **Properties**

| Property | Type                  |                                                                                                                                                  Description |
| :------- | :-------------------- | -----------------------------------------------------------------------------------------------------------------------------------------------------------: |
| events   | `Events`              |                 Array-like collection of `Event` objects. Entries can be accessed by index while simultaneously including methods like `Action.events.add()` |
| isOpen   | `Boolean`             |                                                                                                                        Whether unfolded in the Actions panel |
| name     | `String`              |                                                                                                                                          Name of this action |
| parent   | `ActionSet` \| `null` | The set containing this action (if any). This prop is rewritten each time this action is exposed to an `ActionSet.actions` method like `add()` or `remove()` |
| typename | `String`              |                                                                                                                                           Returns `"Action"` |
| version  | `Number`              |                                                                                                                                              Defaults to `3` |

### **Methods**

<dl>
<dt><a href="#a">load()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Loads current action into memory, must be included inside valid ActionSet. Returns boolean of whether successful</p>
</dd>
<dt><a href="#a">remove()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Removes current action within set (if any). Returns boolean of whether successful</p>
</dd>
<dt><a href="#a">run()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Executes current action, must be included inside valid ActionSet. Returns boolean of whether successful</p>
</dd>
<dt><a href="#a">unload</a> ⇒ <code>Boolean</code></dt>
<dd><p>Unloads current action into memory, must be included inside valid ActionSet. Returns boolean of whether successful</p>
</dd>
</dl>

---

## constructor(config):

| Property | Type                 | Default |                                Description |
| :------- | :------------------- | :------ | -----------------------------------------: |
| config   | `String` \| `Object` | `null`  | Schematic object for action or aia rawtext |

```js
// Say we have a pre-existing set, but we want to add a new custom Action to it.

// Loading a set will construct the actions present dynamically:
var mySet = new ActionSet(new File("~/desktop/someFile.aia"));
alert(mySet.actions[0].name); // Returns "someTestAction", since it was constructed by the set

// To add a new action, we'd need basic information and to fill the remainder with defaults:
var myAction = new Action({
  name: "openColorPicker",
  isOpen: false,
});

// Then add Events to this action:
myAction.events.add(
  new Event() // this is placeholder content for now
);

// And finally add this action to the set:
mySet.actions.add(myAction);

// Allowing us to run it directly:
mySet.run("openColorPicker");
```

---

## **Methods**

## **load**( ) => `Boolean`

Loads the current action into memory _if existing in a set_. Actions cannot interact with the app without a set container.

```js
// We always need a set first:
var mySet = new ActionSet("~/desktop/sampleActions.aia");

var fakeAction = new Action({
  name: "newAction",
}); // It's only fake because I haven't defined the spec
mySet.actions.add(fakeAction);

// We can load this into memory and show in the Actions panel:
fakeAction.load();

// Even if we're out of scope of the fakeAction variable:
mySet.actions.getByName("newAction").load();

// Loading an action locally like above is equivalent to:
mySet.load("newAction");
```

## **remove**( ) => `Boolean`

Removes the current action _if existing in a set_. Actions cannot interact with the app without a set container.

```js
// Get some set:
var mySet = new ActionSet("~/desktop/sampleActions.aia");

// Find a specific action by the name:
var setColor = mySet.actions.getByName("setColor");

alert(mySet.actions.length); // 3

// This is equivalent to mySet.actions.remove("setColor"):
setColor.remove();

alert(mySet.actions.length); // 2
```

## **run**( ) => `Boolean`

Executes the current action _if existing in a set_. Actions cannot interact with the app without a set container.

```js
// Get some set:
var mySet = new ActionSet("~/desktop/sampleActions.aia");

// Find a specific action by the name:
var setColor = mySet.actions.getByName("setColor");

// Execute it:
setColor.run();
```

## **unload**( ) => `Boolean`

Removes the current action into memory _if existing in a set_. Actions cannot interact with the app without a set container.

```js
var mySet = new ActionSet("~/desktop/sampleActions.aia");

mySet.load(); // Say there are 3 actions loaded by this set
// We can change that to 2 with the following:
mySet.actions.getByName("setColor").unload();

// This is equivalent to:
mySet.unload("setColor");
```
