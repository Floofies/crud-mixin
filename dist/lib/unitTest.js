// Low budget unit tests instead of Jasmine or Chai
// Isolates between invocations. Safely contains everything that can go wrong.
export default function unitTest(description, testFunction) {
    const testLog = [`Test: ${description}:`];
    const expectQueue = [];
    class Expectation {
        actualValue;
        constructor(anyValue) {
            this.actualValue = anyValue;
            return this;
        }
        toBe(expectedValue) {
            expectQueue.push(() => {
                if (expectedValue !== this.actualValue)
                    throw new Error(`Expected value "${expectedValue}" but received value "${this.actualValue}" instead.`);
            });
        }
        toNotBe(expectedValue) {
            expectQueue.push(() => {
                if (expectedValue === this.actualValue)
                    throw new Error(`Expected value to not be "${expectedValue}".`);
            });
        }
    }
    function expect(anyValue) {
        return new Expectation(anyValue);
    }
    let caughtError = false;
    let startTime = performance.now();
    let totalTime;
    try {
        testFunction(expect);
        totalTime = (performance.now() - startTime).toFixed(3);
        if (expectQueue.length === 0) {
            testLog.push("	? Tests FAILED: No expectations were defined.");
            process.exitCode = 1;
            caughtError = true;
        }
    }
    catch (error) {
        totalTime = (performance.now() - startTime).toFixed(3);
        testLog.push(`	X Tests FAILED in ${totalTime}ms: ${error}\n		${error.stack.replaceAll("    ", "		  ")}`);
        process.exitCode = 1;
        caughtError = true;
    }
    let totalExp = 0;
    for (const exp of expectQueue) {
        try {
            totalExp++;
            exp();
        }
        catch (error) {
            testLog.push(`	X Tests FAILED in ${totalTime}ms.\n	X Expectation #${totalExp} FAIL: ${error.toString()}`);
            process.exitCode = 1;
            caughtError = true;
        }
    }
    if (!caughtError)
        testLog.push(`	✓ Tests PASSED in ${totalTime}ms.`);
    console.log(testLog.join("\n") + "\n");
}
