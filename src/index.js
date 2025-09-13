async function getComponent() {
  try {
    const { default: _ } = await import("lodash");
    const el = document.createElement("div");

    el.innerHTML = _.join(["hello", "webpack"], " ");
    return el;
  } catch (err) {
    return "An err occurred while loading the component";
  }
}

getComponent().then((comp) => {
  document.body.appendChild(comp);
});
