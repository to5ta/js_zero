export const PlayerConfig = {
    physics: {
        jumpSpeed: 10,
        moveSpeed: 6,
        sprintSpeed: 10,
        width: 0.7,
        depth: 0.3,
        height: 1.9,
        weight: 75.0 // kg
    },
    camera: {
        distanceMobile: 6.0,
        distanceDesktop: 4.5,
        angularSensibilityX: 1500,
        angularSensibilityY: 1500,
        upperBetaLimit: 1.7,  // ca. horizon
        lowerBetaLimit: 0     // zenith
    },
    health: {
        total: 100,
        maxSpeedNoHurt: 10,
        fallDamageMultiplier: 5
    }
};
