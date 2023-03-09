/**
 * Template for boostrap preview js
 */
import { Tooltip } from 'bootstrap';
import 'iframe-resizer/js/iframeResizer.contentWindow';
// bootstrap css
import './main.scss';
import './preview.scss';

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
