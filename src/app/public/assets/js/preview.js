window.addEventListener('DOMContentLoaded', (event) => {
  const preview = document.getElementsByClassName('handoff-field');
  for (let i = 0; i < preview.length; i++) {
    // get data model from the data-handoff attribute
    const dataModel = JSON.parse(decodeURIComponent(preview[i].getAttribute('data-handoff')));
    const charCount = preview[i].innerText.length;
    console.log(dataModel);
    // build a div with the current character count
    // bind doubleclick to enable contenteditable
    preview[i].addEventListener(
      'click',
      function () {
        this.setAttribute('contenteditable', true);
        this.focus();
        // append a div with the current character count
      },
      false
    );
    // bind blur to disable contenteditable
    preview[i].addEventListener(
      'blur',
      function () {
        this.removeAttribute('contenteditable');
      },
      false
    );

    // On single click add a character count element
    preview[i].addEventListener(
      'dblclick',
      function () {
        // tell the frame parent to go to a hash id
        console.log(dataModel.id);
        window.parent.location.hash = dataModel.id;
      },
      false
    );
    // bind keyup to update the character count
    preview[i].addEventListener(
      'keyup',
      function () {
        const charCount = this.innerText.length;
        this.nextElementSibling.innerText = charCount + ' characters';
      },
      false
    );
  }
});
