document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('http://localhost:3000/about');
    const data = await res.json();

    data.forEach(section => {
      const paragraph = document.getElementById(`about-section-${section.id}`);
      if (paragraph) paragraph.textContent = section.content;
    });
  } catch (err) {
    console.error("Failed to load about content:", err);
  }

  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 200);
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});