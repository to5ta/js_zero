
function Div(): HTMLDivElement {
    return document.createElement('div');
}

function Text(): HTMLDivElement {
    return document.createElement('p');
}

function Img(): HTMLImageElement {
    return document.createElement("img");
}

export { Div, Text, Img };