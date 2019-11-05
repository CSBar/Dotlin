let pdfDoc = null,
  pageNum = 1, 
  pageIsRendering = false,
  pageNumIsPending = null,
  initUrl = './docs/sample.pdf';

const scale = 1,
  canvas = document.querySelector('#pdf-render'),
  ctx = canvas.getContext('2d'),
  base64_marker = ';base64,';

// Renders the page.
const renderPage = num => {
  pageIsRendering = true;

  // Gets the page
  pdfDoc.getPage(num).then(page => {
    // Sets scale.
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderCtx = {
      canvasContext: ctx,
      viewport
    };

    page.render(renderCtx).promise.then(() => {
      pageIsRendering = false;

      if (pageNumIsPending != null) {
        renderPage(pageNumIsPending);
        pageNumIsPending = null;
      }
    });

    // Output current page number.
    document.querySelector('#page-num').textContent = num;
  });
};

// Checks for pages rendering
const queueRenderPage = num => {
  if (pageIsRendering) {
    pageNumIsPending = num
  } else {
    renderPage(num);
  }
};

// Shows previous page
const showPrevPage = () => {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
};

// Show next page.
const showNextPage = () => {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
};

const convertDataURIToBinary = dataURI => {
  var base64Index = dataURI.indexOf(base64_marker) + base64_marker.length;
  var base64 = dataURI.substring(base64Index);
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for(var i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

const displayError = errorMsg => {
  const topBar = document.querySelector('.top-bar'),
    pdfControl = document.querySelector('#pdfControl'),
    errorDiv = document.getElementById('errorMsg'),
    errorSpan = document.getElementById('errorSpan');
  
  topBar.classList.add('error');
  pdfControl.style.display = 'none';
  errorSpan.textContent = errorMsg;
  errorDiv.style.display = 'inline';
}

const hideError = () => {
  const topBar = document.querySelector('.top-bar'),
    pdfControl = document.querySelector('#pdfControl'),
    errorDiv = document.getElementById('errorMsg');
  
  topBar.classList.remove('error');
  pdfControl.style.display = 'inline';
  errorDiv.style.display = 'none';
}

const renderPdf = () => {
  const url = document.getElementById('urlInput').value;
  if (url == null || url === '') {
    return;
  }

  // If document is base64 data, then convert to binary first
  if (url.indexOf(base64_marker) > -1) {
    url = convertDataURIToBinary(url);
  }

  // Gets the document
  pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
    pdfDoc = pdfDoc_;

    document.querySelector('#page-count').textContent = pdfDoc.numPages;

    // Moves back to beginning of document
    pageNum = 1;
    hideError();
    renderPage(pageNum);
  }).catch(error => {
    displayError(error.message);
  })
}

// Button events
document.querySelector('#prev-page').addEventListener('click', showPrevPage);
document.querySelector('#next-page').addEventListener('click', showNextPage);
document.querySelector('#refresh').addEventListener('click', renderPdf);

// Starts the reader with initial value
document.getElementById('urlInput').value = initUrl;
renderPdf();
