const fs = require('fs');
const PdfPrinter = require('pdfmake');
const path = require('path');

// Register fonts
const fonts = {
  Roboto: {
    normal: path.join(__dirname, 'RobotoMono-Regular.ttf'),
    bold: path.join(__dirname, 'RobotoMono-Regular.ttf'),
  }
};

const printer = new PdfPrinter(fonts);

// Helper: Get base64 image with MIME type
const getBase64Image = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const base64 = fs.readFileSync(filePath).toString('base64');

  let mimeType = 'image/png'; // default
  if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.webp') mimeType = 'image/webp';

  return `data:${mimeType};base64,${base64}`;
};

const generateRequestPdf = async ({
  fullName,
  address,
  birthdate,
  documents,
  alumniFeeApplied,
  total,
  outputPath,
  idPath,
  proofPath
}) => {
  try {
    const docDefinition = {
      content: [
        { text: 'Document Request Summary', style: 'header' },
        { text: `\nFull Name: ${fullName}` },
        { text: `Birthdate: ${birthdate}` },
        { text: `Address: ${address}` },
        { text: `\nDocuments Requested:\n`, bold: true },

        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Document Type', 'Quantity', 'Price'],
              ...documents.map(doc => [
                doc.type,
                doc.quantity,
                `₱${doc.unit_price}`
              ])
            ]
          }
        },

        alumniFeeApplied ? { text: `\nAlumni Fee Applied: ₱500`, bold: true } : '',
        { text: `\nTotal: ₱${total}`, bold: true },

      {
        columns: [
          {
            width: '*',
            stack: [
              { text: '\n\nValid ID:', style: 'subheader', pageBreak: 'avoid' },
              {
                image: getBase64Image(idPath),
                fit: [250, 250],
                margin: [0, 5, 0, 15],
                pageBreak: 'avoid'
              }
            ]
          },
          {
            width: '*',
            stack: [
              { text: '\n\nProof of Payment:', style: 'subheader', pageBreak: 'avoid' },
              {
                image: getBase64Image(proofPath),
                fit: [250, 250],
                margin: [0, 5, 0, 15],
                pageBreak: 'avoid'
              }
            ]
          }
        ]
      }

      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center'
        },
        subheader: {
          fontSize: 14,
          bold: true
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const writeStream = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      pdfDoc.pipe(writeStream);
      pdfDoc.end();

      writeStream.on('finish', () => resolve());
      writeStream.on('error', err => reject(err));
    });

  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
};

module.exports = generateRequestPdf;