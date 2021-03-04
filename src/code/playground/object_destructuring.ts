interface x {
    a: string;
    y: string;
    z: string;
}

class y implements x {
    a: string;
    y: string;
    z: string;
    constructor(props: { a: string, y: string, z: string }) {
        Object.assign(this, props);
    }
}