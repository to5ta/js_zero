// import * as BABYLON from "babylonjs";
import * as BABYLON from "@babylonjs/core";

function Vec3toString(vec3: BABYLON.Vector3, fixed = 2) {
    return "{"+ vec3.x.toFixed(fixed) +
           " "+ vec3.y.toFixed(fixed) + 
           " "+ vec3.z.toFixed(fixed) + "}";
}

function NormaltoSlopeXZ(vec3: BABYLON.Vector3) : [number, number] {
    var vecXY = new BABYLON.Vector3(vec3.x, vec3.y, 0); vecXY.normalize();
    var vecYZ = new BABYLON.Vector3(0, vec3.y, vec3.z); vecYZ.normalize();
    var pitch = Math.acos(
            BABYLON.Vector3.Dot(vecYZ, BABYLON.Vector3.Up()));
    var roll = Math.acos(
            BABYLON.Vector3.Dot(vecXY, BABYLON.Vector3.Up()));
    return [
        vec3.z<0 ? -pitch : pitch,
        vec3.x<0 ? -roll : roll
    ];
}


function toDeg(rad: number) : number {
    return rad / Math.PI * 180;
}

function toRad(deg : number) : number {
    return deg / 180 * Math.PI;
}

function InjectVec3toLine(vec3: BABYLON.Vector3, line: BABYLON.LinesMesh) {
    // Logging.info("vec3", vec3);
    // Logging.info("line", line);
    line.updateVerticesData(BABYLON.VertexBuffer.PositionKind, [0,0,0,vec3.x, vec3.z, vec3.z]);
}


export {
    Vec3toString,
    NormaltoSlopeXZ,
    toDeg,
    toRad,
    InjectVec3toLine
};