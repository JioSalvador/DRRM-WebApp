  document.addEventListener('DOMContentLoaded', () => {
    const backToTopWrapper = document.querySelector('.back-to-top-wrapper');
    const backToTopButton = document.querySelector('.back-to-top');

    if (!backToTopWrapper || !backToTopButton) return;

    backToTopButton.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      const atBottom = window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 10;

      if (atBottom) {
        backToTopWrapper.classList.add('show');
      } else {
        backToTopWrapper.classList.remove('show');
      }
    });
  });