/**
 * Mixin is a class for handling data via CRUD methods, it implements CRUD operations as methods:
 * "make" for create, "get" for read, "set" for update, and "delete" for delete.
 */
export default interface Mixin {
	/**
	* Creates a new Mixin and assigns the given CRUD methods to it.
	* @param {string} type A value/object to compare against input2.
	* @param {object} [initializer] Optional. An object with any combination of properties "make", "get", "set", "del" assigned to functions.
	*/
	constructor(type: string, initializer?: {[accessor: string]: () => any | null} ): Mixin

	allowOverride(overrides?: {
		allowMake: boolean,
		allowGet: boolean,
		allowSet: boolean,
		allowDel: boolean
	}): void

	patchMixin(mixin: Mixin): void

	patchProperty(mixin: Mixin, accessor: string): void
}

//TODO
export default interface MixinPlugin {

}

export default interface MixinCompositor {

}