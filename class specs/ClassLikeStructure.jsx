// If it has no typename or the typename does not match, then it should have a constructor!

function ActionParameters(arr, parent) {
  arr = arr || [];
  extendPrototype(arr, {
    add: function () {
      for (var i = 0; i < arguments.length; i++) {
        this.push(arguments[i]);
      }
    },
    removeAll: function () {
      for (var i = this.length; !!i; i--) this.pop();
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
        this.push(arguments[i]);
      }
    },
    removeAll: function () {
      for (var i = this.length; !!i; i--) this.pop();
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
        this.push(arguments[i]);
        this.parent.actionCount = this.length;
      }
    },
    removeAll: function () {
      for (var i = this.length; !!i; i--) this.pop();
    },
    getByName: function (query) {
      for (var i = 0; i < this.length; i++)
        if (this[i].name && this[i].name == query) return this[i];
      return null;
    },
  });
  arr.parent = parent;
  arr.typename = "ActionCollection";
  return arr;
}
function extendPrototype(target) {
  var arg, obj, key;
  for (arg = 1; arg < arguments.length; ++arg) {
    obj = arguments[arg];
    for (key in obj) if (obj.hasOwnProperty(key)) target[key] = obj[key];
  }
  return target;
}

function ActionParameter(obj) {
  this.typename = "ActionParameter";
  for (var key in obj) this[key] = obj[key];
}
function ActionEvent(obj) {
  this.typename = "ActionEvent";
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
  if (this.parent && this.parent.parent) {
    var str = this.name + "::" + this.parent.parent.name;
    alert(str);
  } else {
    alert(
      "Action is not properly mounted to a parent chain of Self > Collection > Set"
    );
  }
};
function ActionSet(name) {
  this.typename = "ActionSet";
  this.name = name;
  this.actionCount = 0;
  this.actions = new Actions([], this);
}
var testSet = new ActionSet("foo");

testSet.actions.add(
  new Action({
    name: "ApplyFill",
    events: [
      new ActionEvent({
        localizedName: "Set color",
        hasDialog: 0,
        parameters: [
          new ActionParameter({
            key: "idct",
          }),
        ],
      }),
    ],
  }),
  new Action({ name: "SelectAll" })
);
var action1 = testSet.actions[0];
action1.run(); // Verified chain
