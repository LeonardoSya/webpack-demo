import lodash from "lodash";
import Icon from "./icon.JPG";
import "./style.css";

function component() {
  const el = document.createElement("div");
  el.innerHTML = lodash.join(["hello", "webpack"], " ");
  el.classList.add("hello");

  const myIcon = new Image();
  myIcon.src = Icon;
  el.appendChild(myIcon);

  return el;
}

document.body.appendChild(component());
