// var THREE = require('three');


var div1 = document.createElement("div");
document.body.appendChild(div1);
div1.style.zIndex = 100;
div1.style.backgroundColor = "rgba(1,1,100,100)";
//div1.style.opacity = "1";
div1.style.left = "100px";
div1.style.height = "301px";

var h = 100;

setInterval(() => {
    var hstr = h.toString().concat("px");
    //console.log(hstr);
    h+= 1;
    div1.style.height = hstr;
    if(h>window.innerHeight) {
        h = 0;
    }
 }, 10);