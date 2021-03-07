abstract class AsyncContentOwner {
    private childrenReadyFlags = new Map<string, boolean>();
    
    // gets called when loading of all children is finished 
    abstract onChildrenLoaded: () => void; 

    constructor() {
        Object.values(this).forEach(element => {
            if (element.hasOwnProperty("typeAsyncContent")) {
                let member = element as AsyncContent;
                this.childrenReadyFlags.set(member.name, false);
            }
        });
    }

    onChildLoaded(childName: string) {
        this.childrenReadyFlags.set(childName, true);
        let allTrue = true;
        for (const flag in this.childrenReadyFlags.values()) {
            if (!flag) { 
                allTrue = false; 
                break; 
            }
        }
        if (allTrue) {
            this.onChildrenLoaded();
        }
    }
}

abstract class AsyncContent {
    private parent: AsyncContentOwner;
    readonly name: string;

    // mark derived classes
    readonly typeAsyncContent = AsyncContent.name;  

    constructor(
        parent: AsyncContentOwner,
        name: string
    ) {
        this.parent = parent;
        this.name = name;
    }

    // inform parent that a specific child finished loading
    private onLoadingComplete() {
        this.parent.onChildLoaded(this.name);
    }
}