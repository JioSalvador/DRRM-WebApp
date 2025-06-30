    document.addEventListener("DOMContentLoaded", function () {
      const textareas = document.querySelectorAll('.editable-text');
      const saveButtons = document.querySelectorAll('.save-btn');

      textareas.forEach((textarea, index) => {
        const saveBtn = saveButtons[index];

        textarea.addEventListener('click', () => {
          if (textarea.hasAttribute('readonly')) {
            textarea.removeAttribute('readonly');
            textarea.focus();
            saveBtn.disabled = false;
          }
        });

        saveBtn.addEventListener('click', () => {
          textarea.setAttribute('readonly', true);
          saveBtn.disabled = true;
          console.log(`Saved content ${index + 1}:`, textarea.value);
        });
      });
    });