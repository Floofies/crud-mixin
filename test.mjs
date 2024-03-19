import unitTest from "./dist/lib/unitTest.js";
import { Mixin, MixinPlugin, MixinCompositor } from "./dist/index.js";

// Basic mixin instance for testing purposes.
function createDummyMixin(type) {
	function make() { }
	function get() { }
	function set() { }
	function del() { }
	return new Mixin(type, { make, get, set, del });
}

console.log("⚡ Starting crud-mixin unit tests:");
const startTime = performance.now();

unitTest("Mixin constructor should assign CRUD functions to itself", expect => {
	function make() { }
	function get() { }
	function set() { }
	function del() { }
	const mixin = new Mixin("TestType", { make, get, set, del });
	expect(mixin.make).toBe(make);
	expect(mixin.get).toBe(get);
	expect(mixin.set).toBe(set);
	expect(mixin.del).toBe(del);
});

unitTest("Mixin.patchMixin should prevent overrides by default", expect => {
	const mixin1 = createDummyMixin("TestType");
	const mixin2 = createDummyMixin("TestType");
	mixin1.patchMixin(mixin2);
	expect(mixin1.make).toNotBe(mixin2.make);
	expect(mixin1.get).toNotBe(mixin2.get);
	expect(mixin1.set).toNotBe(mixin2.set);
	expect(mixin1.del).toNotBe(mixin2.del);
});

unitTest("Mixin.patchMixin should mix CRUD functions between mixins", expect => {
	const mixin1 = new Mixin("TestType");
	const mixin2 = createDummyMixin("TestType");
	mixin1.patchMixin(mixin2);
	expect(mixin1.make).toBe(mixin2.make);
	expect(mixin1.get).toBe(mixin2.get);
	expect(mixin1.set).toBe(mixin2.set);
	expect(mixin1.del).toBe(mixin2.del);
});

unitTest("MixinCompositor.addMixin should mix CRUD functions between identical types", expect => {
	const mixin1 = new Mixin("TestType");
	const mixin2 = createDummyMixin("TestType");
	const compositor = new MixinCompositor();
	compositor.addMixin(mixin1);
	compositor.addMixin(mixin2);
	expect(mixin1.make).toBe(mixin2.make);
	expect(mixin1.get).toBe(mixin2.get);
	expect(mixin1.set).toBe(mixin2.set);
	expect(mixin1.del).toBe(mixin2.del);
});

unitTest("MixinCompositor.addMixin should not mix CRUD functions between non-identical types", expect => {
	const mixin1 = new Mixin("TestTypeOne");
	const mixin2 = createDummyMixin("TestTypeTwo");
	const compositor = new MixinCompositor();
	compositor.addMixin(mixin1);
	compositor.addMixin(mixin2);
	expect(mixin1.make).toNotBe(mixin2.make);
	expect(mixin1.get).toNotBe(mixin2.get);
	expect(mixin1.set).toNotBe(mixin2.set);
	expect(mixin1.del).toNotBe(mixin2.del);
});

//TODO: Test MixinPlugin and MixinCompositor

console.log(`Unit tests finished in ${(performance.now() - startTime).toFixed(3)}ms.`);