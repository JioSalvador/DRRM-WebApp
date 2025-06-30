 const imageInput = document.getElementById('newsImage');
  const preview = document.getElementById('preview');
  const modal = new bootstrap.Modal(document.getElementById('imageCropperModal'));
  const modalPreview = document.getElementById('modalPreview');
  const zoomSlider = document.getElementById('zoomSlider');
  const newsTitle = document.getElementById('newsTitle');
  const newsContent = document.getElementById('newsContent');
  const newsAuthor = document.getElementById('newsAuthor');
  let cropper;

  imageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        modalPreview.src = e.target.result;
        preview.src = '#';
        preview.classList.add('d-none');
        modal.show();
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('imageCropperModal').addEventListener('shown.bs.modal', function () {
    if (cropper) cropper.destroy();
    cropper = new Cropper(modalPreview, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      background: false,
      responsive: true,
      zoomOnWheel: true,
      zoomOnTouch: true,
      guides: false,
      center: true,
      highlight: false,
      ready() {
        zoomSlider.value = 0;
      }
    });
  });

  document.getElementById('imageCropperModal').addEventListener('hidden.bs.modal', function () {
    if (cropper) cropper.destroy();
  });

  document.getElementById('saveCroppedImage').addEventListener('click', function () {
    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    preview.src = canvas.toDataURL('image/png');
    preview.classList.remove('d-none');
    modal.hide();
  });

  document.getElementById('zoomInBtn').addEventListener('click', function () {
    if (cropper) {
      cropper.zoom(0.1);
      zoomSlider.value = parseFloat(zoomSlider.value) + 0.1;
    }
  });

  document.getElementById('zoomOutBtn').addEventListener('click', function () {
    if (cropper) {
      cropper.zoom(-0.1);
      zoomSlider.value = parseFloat(zoomSlider.value) - 0.1;
    }
  });

  zoomSlider.addEventListener('input', function () {
    if (cropper) {
      const zoomLevel = parseFloat(this.value);
      cropper.zoomTo(zoomLevel + 1); // base zoom starts at 1
    }
  });

  document.getElementById('clearBtn').addEventListener('click', function () {
    newsTitle.value = '';
    newsContent.value = '';
    newsAuthor.value = '';
    preview.src = '#';
    preview.classList.add('d-none');
    if (cropper) cropper.destroy();
  });

  document.getElementById('newsForm').addEventListener('submit', function (event) {
    event.preventDefault();
    alert('News Created!');
  });