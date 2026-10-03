export const PhysicsConfig = {
    gravity: -9.81,
    // Fake physics value used in controller (looks better than real gravity)
    fakeFallingAcceleration: 20,
    groundCheckRayLength: 0.01, // Added to height/2
    groundContactThreshold: 0.05
};
