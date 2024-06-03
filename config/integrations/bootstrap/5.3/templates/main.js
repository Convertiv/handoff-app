// bootstrap
import { Tooltip } from 'bootstrap';
// bootstrap css
import './main.scss';

// enable tooltips
document.addEventListener('DOMContentLoaded', function (event) {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) =>
      new Tooltip(tooltipTriggerEl, {
        boundary: document.body,
      })
  );
});
