# CRUD Mixins

CRUD mixins for JavaScript. Use cases: Manipulating data, creating plugin systems, and creating data-oriented coupling middleware.

- [Principles of Operation](#principles-of-operation)
  - [Mixin Class](#mixin-class)
  - [MixinPlugin Class](#mixinplugin-class)
  - [MixinCompositor Class](#mixincompositor-class)
- [Theory of Operation](#theory-of-operation)
  - [No-Override Principle](#no-override-principle)
  - [CRUD Mixin Plugins](#crud-mixin-plugins)

# Principles of Operation

The classes `Mixin`, `MixinPlugin`, and `MixinCompositor` are exported by the `mixin.js` module, and can be combined by your application to compose a data-oriented plugin system. `Mixin` instances implement CRUD operations as methods.

## `Mixin` Class

```JS
new Mixin( type, { [ make = null, get = null, set = null, del = null ] });
```

When `Mixin` is instantiated, the methods supplied to the constructor are assigned to the instance.

### `Mixin` Constructor Parameters

- `type` **String**

  The unique type definition string used to identify the mixin and its data.

Constructor parameters are optionally supplied via an object with the following properties:

- `make` _(Optional)_ **Function**:
  - For creating new data of a specific type.
- `get` _(Optional)_ **Function**:
  - For reading persistent data of a specific type.
- `set` _(Optional)_ **Function**:
  - For writing persistent data of a specific type.
- `del` _(Optional)_ **Function**:
  - For deleting persistent data of a specific type.

### `patchProperty` Instance Method

```JS
mixin.patchProperty( mixin2, accessor );
```

Implements compositing between instances of `Mixin`; the method attempts to copy properties from the given object to the parent object if that property is missing from the parent.

### `patchMixin` Instance Method

```JS
mixin.patchMixin( mixin2 );
```

Calls `this.patchProperty` on all of its own CRUD methods.

### Example `Mixin` Usage

A real-world example of CRUD mixins is HockIt's `config.js` module and its `JSONConfig` mixin.

HockIt loads initial configuration data from a JSON file, and it does so via the mixin `JSONConfig`. All methods in Mixin `JSONConfig` are implemented by Plugin `JSONConfigPlugin` (named `config.js`).

Here is a very simplified example of how the plugin is implemented:

```JS
// Import the Mixin and MixinPlugin classes:
const { Mixin } =  require("crudMixin.js");

// The filesystem path of the default configuration file:
const defaultConfPath = __dirname + "/config.json";

// A Mixin for creating the default configuration object:
const JSONConfig = new Mixin("JSONConfig", {
	make: () => fs.readFileSync(defaultConfPath).toString("utf8");
});

// How the Mixin should be used:
const config = JSONConfig.make();
```

## `MixinPlugin` Class

```JS
new MixinPlugin({ [ loadCondition = null, initPlugin = null, allowOverride = false, ...mixins ] });
```

### `MixinPlugin` Constructor Parameters

Constructor parameters are supplied via an object with the following properties:

- `loadCondition` _(Optional)_ **Function**:
  - When the given function returns false, the plugin will not be loaded.
- `initPlugin` _(Optional)_ **Function**:
  - This function is arbitrarily executed after mixins are patched. Use this function to perform preparatory steps.
- `allowOverride`
  - When set to `true`, automatically marks all CRUD methods of all child mixins as overwritable.
- `...mixins` **Mixin**:
  - Instances of `Mixin`.


### Example `MixinPlugin` Usage

In this example scenario, we construct a "guestbook" application by combining functionalities supplied by two different plugins.

The following mixin plugin exports a `MyGreeting` mixin with its `make` method defined.

```JS
// Import the Mixin and MixinPlugin classes:
const { Mixin, MixinPlugin } = require("../crudMixin.js");

// Instantiate a new Mixin with type definition "MyGreeting":
const MyGreeting = new Mixin("MyGreeting",
	// Define the "make" method to output "Hello world!" or use a custom name:
	make = (name) => `Hello ${name}!`
);

// Export the Mixin inside a new MixinPlugin:
module.exports = new MixinPlugin({
	// Name of the plugin:
	name: "MyGreetingPlugin",
	// Version of the plugin:
	version: "1.2.3",
	// The mixin to be exported:
	MyGreeting
});
```

The following mixin plugin exports a similar `MyGreeting` mixin, however it lacks `make` and instead supplies `get` and `set` methods.

The `set` method logs greetings into a "guestbook" Map, whereas `get` retrirves previously logged greetings.

```JS
// Import the Mixin and MixinPlugin classes:
const { Mixin, MixinPlugin } = require("../crudMixin.js");

// Local variable for storing the data:
const guestbook = new Map();

// Instantiate a new Mixin with type definition "MyGreeting":
const MyGreeting = new Mixin("MyGreeting",
	// Define the "get" method to retrieve a greeting by name:
	get = (name) => {
		return guestbook.get(name);
	},
	// Define the "set" method to store a greeting by name:
	set = (name, greeting = null) => {
		guestbook.set(name, greeting);
	}
);

// Export the Mixin inside a new MixinPlugin:
module.exports = new MixinPlugin({
	name: "MyStoragePlugin",
	version: "4.5.6",
	MyGreeting
});
```

## `MixinCompositor` Class

An instance of `MixinCompositor` composites mixins together, effectively "mixing" them. If at least two mixins are of the same type, then the constructor or `addMixin` method joins them together via calling the `patchMixin` methods of each mixin. The resulting instance of `MixinCompositor` assigns all given mixins to itself for easy access.

Mixins and mixin plugins can be manually added via methods `addMixin` and `addPlugin`.

### `addMixin` Instance Method

### `addPlugin` Instance Method

### `initMixinPlugins` Instance Method

### Example `MixinCompositor` Usage

Now in our main module (the business logic) we can combine the mixins and use them:

```JS
// Import the Mixin, MixinPlugin, and SetupMixin classes:
const { Mixin, MixinPlugin, MixinCompositor } = require("../crudMixin.js");

// Instantiate a new Mixin with type definition "MyGreeting".
// This instance lacks method definitions, but will be populated by "MixinCompositor":
const MyGreeting = new Mixin("MyGreeting");

// Define a plugin to contain the Mixins you intend to use:
const myPlugin = {
	name: "MyGuestbookPlugin",
	version: "7.8.9",
	MyGreeting
};

// Cross-inherit the Mixins via MixinCompositor, which returns a Promise:
const setupPromise = new MixinCompositor(myPlugin);

// Now that the "MyGreeting" Mixin is cross-inherited between plugins, we can use it.
// This is the main logic of our application:
setupPromise.then(() => {
	const name = "Testy McFly";
	// Generate a new greeting string:
	const greeting = MyGreeting.make(name);
	// Add the greeting to the guestbook:
	MyGreeting.set(greeting);
	// Logs "Hello Testy McFly!" to console:
	console.log(MyGreeting.get(name));
});
```

# Theory of Operation

`Mixin` is a class which implements CRUD methods for manipulating any non-volatile/persistent data.

In object-oriented programming, a mixin is a way to reuse a class's code in multiple class hierarchies. Mixins are a powerful concept that allows for flexible and modular code organization, and promoting code reuse.

In this context, CRUD operations are "mixed in" with the `Mixin` objects that lack those methods. This combination ensures that each object contains an equivalent set of methods without overriding existing ones.

CRUD Mixins should be created as a single-instance uniqueness type within each module, and should be preserved in-memory for any subsequent needs. Instances of `Mixin` should be _invoked_ as a result of user input, but never _created_ as a result of user input.

The `patchProperty(mixin, accessor)` and `patchMixin(mixin)` methods implement compositing between instances of `Mixin`; the methods attempt to copy methods from the given mixin to the parent mixin if those methods are missing.

## No-Override Principle

Instances of `Mixin` store a write-protection descriptor object in the property `writeProtectedMethods`, which is an object containing CRUD method accessors mapped to booleans to indicate which methods are write-protected. The write-protection descriptor is utilized in the method `patchProperty`.

If the parent mixin already has a method, then `patchProperty` and `patchMixin` will opt to skip writing that method. If overwriting is desired anyways, then write-protection must be disabled for that method. That is because `patchProperty` enforces a no-override principle when compositing mixins, such that by default each mixin is not allowed to overwrite another mixin's methods. Conversely, any locally declared instances of `Mixin` can still have their own methods defined, and they won't be overwritten after they are exported. This also means that as mixins are patched, each missing method is patched semi-permanently and can't be patched again unless the restriction is bypassed.

The no-override restriction may be bypassed manually via three different ways:

1. Exporting the parent `MixinPlugin` with `allowOverride = true`.
2. Calling the `Mixin` constructor with `allowOverride = true` as an input operand.
3. Calling the `Mixin` instance method `allowOverride()`:

- Example: `MyMixin.allowOverride(allowMake = true, allowGet = true, allowSet = true, allowDel = true)`

`patchProperty` allows a single overwrite of each CRUD method before overwrite-protecting them again.

### CRUD Mixin Plugins

Plugins are composed of exported `MixinPlugin` instances which are later parsed by `MixinCompositor`.

Each plugin module pre-loads functions into local instances of `Mixin` which are then packaged into a `MixinPlugin` instance and exported. The `MixinPlugin` instances are later imported into an instance of `MixinCompositor`.

A plugin module exports a `MixinPlugin` instance which contains `Mixin` instances and the following:

- `name`: A string name for the plugin. Helps to differentiate stack traces.
- `version`: A semantic versioning string. It is arbitrary for now.
- `allowOverride` (Optional): A boolean, if set to `true`, allows methods of the given mixins to be overridden at least once.
- `initPlugin` (Optional): A function to execute after all `Mixin` instances have been prepared.
- `loadCondition` (Optional): A function which cancels plugin loading if it returns falsy.
