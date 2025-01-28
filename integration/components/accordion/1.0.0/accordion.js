import * as bootstrap from 'bootstrap';
window.onload = function () {
  const elements = document.getElementsByClassName("accordion");
  for (let i = 0; i < elements.length; i++) {
    let accordion = elements[i];
    console.log(accordion);
    if (accordion !== null) {
      accordion.addEventListener("show.bs.collapse", function (e) {
        // enable all toggle buttons
        this.querySelectorAll(".accordion-button[disabled]").forEach(
          (button) => (button.disabled = false)
        );

        // disable current button on accordion hide
        e.target
          .closest(".accordion-item")
          ?.querySelector(".accordion-button")
          ?.setAttribute("disabled", true);
      });
    }
  }
};
