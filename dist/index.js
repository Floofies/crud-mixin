// A class for handling data via CRUD methods.
// Mixin implements CRUD operations as methods:
//  "make" for create, "get" for read, "set" for update, and "delete" for delete.
export class Mixin {
    // Unique type definition string
    type;
    // Which methods can be overwritten via patchProperty
    writeProtectedMethods = {
        make: true,
        get: true,
        set: true,
        del: true
    };
    make = null;
    get = null;
    set = null;
    del = null;
    constructor(type, { make = null, get = null, set = null, del = null } = {}) {
        // Unique type definition string
        this.type = type;
        // Creates new data of the defined type.
        this.make = make;
        // Retrieves data from Plugins.
        this.get = get;
        // Transmits data to Plugins.
        this.set = set;
        // Deletes specific persistent data.
        this.del = del;
    }
    // Mark each method as overwritable
    allowOverride({ allowMake = true, allowGet = true, allowSet = true, allowDel = true } = {}) {
        this.writeProtectedMethods.make = !allowMake;
        this.writeProtectedMethods.get = !allowGet;
        this.writeProtectedMethods.set = !allowSet;
        this.writeProtectedMethods.del = !allowDel;
    }
    // Attempt to copy all CRUD methods from the given mixin to the parent
    patchMixin(mixin) {
        this.patchProperty(mixin, "make");
        this.patchProperty(mixin, "get");
        this.patchProperty(mixin, "set");
        this.patchProperty(mixin, "del");
    }
    // Attempt to copy a property from the given object to the parent
    patchProperty(mixin, accessor) {
        if (!mixin.hasOwnProperty(accessor))
            return;
        if (this.hasOwnProperty(accessor) && this[accessor] !== null)
            // Method already exists and is non-overridable:
            if (this.writeProtectedMethods[accessor])
                return;
        // Mark method as non-overridable after single overwrite:
        this.writeProtectedMethods[accessor] = true;
        this[accessor] = mixin[accessor];
    }
}
;
export class MixinPlugin {
    // Name of the plugin
    name = "Untitled Plugin";
    // Semantic version string of the plugin itself
    version = "0.0.0";
    // If true, allows all mixins in the plugin to have their CRUD methods overwritten
    allowOverride = false;
    // Function which does preparatory steps after mixins are patched
    initPlugin = null;
    // Function which cancels loading of the plugin if the given function returns false
    loadCondition = null;
    constructor(initializerObj) {
        Object.assign(this, initializerObj);
        if (!this.allowOverride)
            return;
        for (const prop in this) {
            // Skip known non-Mixins:
            if (prop === "name"
                || prop === "version"
                || prop === "allowOverride"
                || prop === "initPlugin"
                || prop === "loadCondition")
                continue;
            const mixin = this[prop];
            // Mark each Mixin as overwritable:
            mixin.allowOverride();
        }
    }
}
// Combines MixinPlugins and Mixins from multiple modules.
// Mixins share their CRUD methods with other Mixins of the same type which also lack those methods.
// LESS THAN 50% PEANUTS*
export class MixinCompositor {
    plugins = {};
    mixins = {};
    // Returns a promise which resolves when all plugins are initialized.
    constructor(plugins = []) {
        for (const plugin of plugins)
            this.addPlugin(plugin);
    }
    // Run initialization functions for each plugin, if they exist.
    async initMixinPlugins(...initParameters) {
        for (const name in this.plugins) {
            const plugin = this.plugins[name];
            if ("initPlugin" in plugin && plugin.initPlugin !== null)
                await plugin.initPlugin.call(plugin, initParameters);
        }
        return this;
    }
    // Add a plugin and any mixins it contains, calls addMixin for each mixin.
    addPlugin(plugin) {
        const pluginName = ("name" in plugin) ? plugin.name : "Untitled Plugin";
        // loadCondition cancels plugin loading if it returns falsy.
        if ("loadCondition" in plugin && plugin.loadCondition !== null)
            if (!plugin.loadCondition())
                return;
        this.plugins[pluginName] = plugin;
        for (const prop in plugin) {
            // Skip known non-Mixins:
            if (prop === "name"
                || prop === "version"
                || prop === "allowOverride"
                || prop === "initPlugin"
                || prop === "loadCondition")
                continue;
            // Cross-inherit the Mixins:
            this.addMixin(plugin[prop]);
        }
    }
    // Add a mixin to the internal list.
    // Patch missing mixin methods with existing mixins of the same type.
    addMixin(mixin) {
        if (!("type" in mixin))
            throw new TypeError("Mixin plugin missing type definition: " + mixin);
        const type = mixin.type;
        if (!(type in this.mixins))
            this.mixins[type] = [];
        else
            for (const mixin2 of this.mixins[type]) {
                mixin.patchMixin(mixin2);
                mixin2.patchMixin(mixin);
            }
        this.mixins[type].push(mixin);
    }
}
