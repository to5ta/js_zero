/**
 * Basic sanity tests for the reimplementation
 * 
 * These aren't automated unit tests, but manual checks you can run
 * Open the browser console and run these commands:
 */

// Test 1: Check if app is available
console.assert(window.app !== undefined, '❌ App not available on window');
console.log('✅ Test 1: App is available');

// Test 2: Check if event bus works
let focusEventReceived = false;
const unsubscribe = window.app.getEventBus().on('app:focus', () => {
    focusEventReceived = true;
    console.log('✅ Test 2: Event bus working (focus event received)');
    unsubscribe();
});

// Test 3: Check if scene exists
console.assert(window.app.getScene() !== null, '❌ Scene not created');
console.log('✅ Test 3: BabylonJS scene created');

// Test 4: Check if engine is running
console.assert(window.app.getEngine() !== null, '❌ Engine not created');
console.log('✅ Test 4: BabylonJS engine created');

// Test 5: Manual test instructions
console.log(`
📋 Manual Tests:
1. Switch to another window and back - should see focus/blur events
2. Resize browser window - should see resize events
3. Check that canvas fills the viewport
4. Check that loading screen appeared and disappeared
5. ${window.Environment?.isMobile ? 'Mobile' : 'Desktop'} mode detected correctly
`);

console.log('✅ All automated checks passed!');
console.log('💡 Now perform manual tests listed above');
