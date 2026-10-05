document.querySelectorAll('form[data-static-contact]').forEach((form) => {
  const button = form.querySelector('[data-static-submit]');
  const confirmation = form.querySelector('[data-static-confirmation]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.reset();
    confirmation.hidden = false;
  });
  button.addEventListener('click', () => form.requestSubmit());
});
