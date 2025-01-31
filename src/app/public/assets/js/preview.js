const ucWords = (str) =>
  str
    .toLowerCase()
    .replace(/\b[a-z]/g, function (letter) {
      return letter.toUpperCase();
    })
    .replaceAll('_', ' ');

window.addEventListener('DOMContentLoaded', (event) => {
  const preview = document.getElementsByClassName('handoff-field');

  const charCountDiv = document.createElement('div');
  charCountDiv.setAttribute('class', 'handoff-char-count');
  document.body.appendChild(charCountDiv);
  const updateCharCount = (field, type, count) => {
    charCountDiv.classList.add('visible');
    charCountDiv.innerText = `${ucWords(field)} - Type: ${ucWords(type)} Count: ${count}`;
  };
  const setPosition = (element) => {
    const rect = element.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const left = rect.left + window.scrollX;
    charCountDiv.style.top = `${top}px`;
    charCountDiv.style.left = `${left}px`;
  };

  for (let i = 0; i < preview.length; i++) {
    const element = preview[i];
    // get data model from the data-handoff attribute
    const data = element.getAttribute('data-handoff');
    const target = element.getAttribute('data-handoff-field');
    let dataModel = {};
    if (data) {
      dataModel = JSON.parse(decodeURIComponent(data));
    }
    const charCount = element.innerText.length;
    element.addEventListener(
      'click',
      function (event) {
        event.preventDefault();
        this.setAttribute('contenteditable', true);
        this.focus();
      },
      false
    );

    element.addEventListener('mouseover', function () {
      setPosition(this);
      updateCharCount(dataModel.id, dataModel.type, charCount);
    });

    // bind blur to disable contenteditable
    element.addEventListener(
      'blur',
      function () {
        this.removeAttribute('contenteditable');
      },
      false
    );

    // On single click add a character count element
    element.addEventListener(
      'dblclick',
      function () {
        window.parent.location.hash = target ? target : dataModel.id;
      },
      false
    );
    // bind keyup to update the character count
    element.addEventListener(
      'keyup',
      function () {
        charCount = this.innerText.length;
      },
      false
    );
  }
});
