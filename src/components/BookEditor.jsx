import { useState, useRef, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faFont, faHighlighter, faTrash} from "@fortawesome/free-solid-svg-icons";
import { Editor, EditorProvider, Toolbar, BtnBold, BtnItalic, BtnUnderline,BtnStyles } from "react-simple-wysiwyg";

function BookEditor() {
  const [title, setTitle] = useState("");
  const author = "Siya Pandey";
  const [pages, setPages] = useState([{ name: "", content: "" }]);
  const lastPageRef = useRef(null);

 //Initializes a new JSZip instance, which will be used to build the ZIP file.

 const generateEbook = () => {
  const zip = new JSZip();

  // Set the metadata for the book
  //Purpose: Adds the mimetype file to the ZIP archive. It's crucial that this file is added without compression (STORE method in JSZip), as it specifies the EPUB file type and must be the first file in the ZIP archive.
  const mimetype = "application/epub+zip";
  zip.file("mimetype", mimetype);
  // Add META-INF/container.xml
  //Purpose: Adds the container.xml file, which points to the main EPUB content file (content.opf). This file is essential for EPUB readers to locate the content metadata.
  const container =
    '<?xml version="1.0"?>' +
    '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
    "  <rootfiles>" +
    '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />' +
    "  </rootfiles>" +
    "</container>";
  zip.file("META-INF/container.xml", container);
  // Add META-INF/container.xml
  //Purpose: Defines the content.opf file, which contains metadata about the eBook such as title, creator, language, manifest (list of all files in the eBook), and spine (order of XHTML pages). This file is crucial for EPUB readers to interpret and display the eBook content correctly.
  const metadata =
    '<?xml version="1.0"?>' +
    '<package version="3.0" xml:lang="en" xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id">' +
    '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
    '    <dc:identifier id="book-id">urn:uuid:B9B412F2-CAAD-4A44-B91F-A375068478A0</dc:identifier>' +
    '    <meta refines="#book-id" property="identifier-type" scheme="xsd:string">uuid</meta>' +
    '    <meta property="dcterms:modified">2000-03-24T00:00:00Z</meta>' +
    "    <dc:language>en</dc:language>" +
    `    <dc:title>${title}</dc:title>` +
    `    <dc:creator>${author}</dc:creator>` +
    "  </metadata>" +
    "  <manifest>" +
    pages
      .map(
        (_, index) =>
          `<item id="page${index}" href="page${index}.xhtml" media-type="application/xhtml+xml"/>`
      )
      .join("") +
    '    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>' +
    "  </manifest>" +
    '  <spine toc="toc">' +
    pages.map((_, index) => `<itemref idref="page${index}"/>`).join("") +
    "  </spine>" +
    "</package>";
  zip.file("OEBPS/content.opf", metadata);

  // Set the table of contents for the
  // Add OEBPS/toc.
  //Purpose: Adds the toc.ncx file, which serves as the table of contents for the EPUB. It defines the navigation structure (navMap) of the eBook, linking each page (pageX.xhtml) with a corresponding navigation point.
  const toc =
    '<?xml version="1.0"?>' +
    '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">' +
    "  <head>" +
    '    <meta name="dtb:uid" content="urn:uuid:B9B412F2-CAAD-4A44-B91F-A375068478A0"/>' +
    '    <meta name="dtb:depth" content="1"/>' +
    '    <meta name="dtb:totalPageCount" content="0"/>' +
    '    <meta name="dtb:maxPageNumber" content="0"/>' +
    "  </head>" +
    "  <docTitle>" +
    `    <text>${title}</text>` +
    "  </docTitle>" +
    "  <navMap>" +
    pages
      .map(
        (_, index) =>
          `<navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">` +
          `  <navLabel>` +
          `    <text>Page ${index + 1}</text>` +
          `  </navLabel>` +
          `  <content src="page${index}.xhtml"/>` +
          `</navPoint>`
      )
      .join("") +
    "  </navMap>" +
    "</ncx>";
  zip.file("OEBPS/toc.ncx", toc);

  // Add the text of the book to the ZIP file
  // Add XHTML
  //Purpose: Iterates over each page's content stored in the pages array and adds it as XHTML files (pageX.xhtml) to the EPUB. Each XHTML file represents a page in the eBook, formatted with HTML content that includes the page title and content.
  //pages.forEach((content, index) => {
  pages.forEach((page, index) => {
    const text =
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
      "<!DOCTYPE html>" +
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">' +
      "  <head>" +
      `    <title>${page.name || ""}</title>` +
      "  </head>" +
      "  <body>" +
      `    <section>
        <h1>${page.name || ""}</h1>` +
      //`      <p>${content}</p>` +
      `      <p>${page.content}</p>` +
      "    </section>" +
      "  </body>" +
      "</html>";
    zip.file(`OEBPS/page${index}.xhtml`, text);
  });

  // Generate a downloadable EPUB file from the ZIP file
  //Purpose: Generates the EPUB file asynchronously as a Blob object (blob) using zip.generateAsync(). Once generated, the file is saved locally using saveAs() from the FileSaver.js library, prompting the user to download it with the specified filename (${title}.epub).

  zip.generateAsync({ type: "blob" }).then(function (blob) {
    saveAs(blob, `${title}.epub`);
  });
};

  useEffect(() => {
    if (lastPageRef.current) {
      lastPageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [pages.length]);
  const addPage = () => {
    
    setPages([...pages, { name: "", content: "" }]); //Add an empty page as an objext
  };
  const updatePageName = (index, newName) => {
    const updatedPages = pages.map((page, pageIndex) => {
      if (pageIndex === index) {
        return { ...page, name: newName };
      }
      return page;
    });
    setPages(updatedPages);
  };
  const deletePage = () => {
   
    if (pages.length > 1) {
      setPages(pages.slice(0, -1));
    }
  };

  const updatePageContent = (index, newContent) => {
    const updatedPages = pages.map((page, pageIndex) => {
      if (pageIndex === index) {
        return { ...page, content: newContent };
      }
      return page;
    });
    setPages(updatedPages);
  }; 

return (
  <EditorProvider>
  <div className="space-y-4 relative">
    <div className="flex justify-between space-x-50">
      <input
        type="text"
        className="font-bold text-2xl px-4 py-2 border w-1/2"
        placeholder="Title of the book"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button
        className="px-4 py-2 bg-black text-white rounded float-right disabled:bg-gray-500 disabled:cursor-not-allowed"
        onClick={generateEbook}
        disabled={pages.every((page) => page.content === "")}
      >
        Generate eBook
      </button>
    </div>

    <div className="flex flex-col items-start float-start sm:absolute left-0 bottom-0">
      <Toolbar style={{display:'flex', flexDirection:'column', }}>
        <BtnBold style={{color:'white',backgroundColor:'black', borderRadius:'5px',margin:'0.5rem'}}/>
        <BtnItalic style={{color:'white',backgroundColor:'black', borderRadius:'5px',margin:'0.5rem'}}/>
        <BtnUnderline style={{color:'white',backgroundColor:'black', borderRadius:'5px',margin:'0.5rem'}}/>
        <BtnStyles style={{color:'white',backgroundColor:'black', borderRadius:'5px', padding:'0.5rem',margin:'0.5rem'}}/>
        {/* <FontAwesomeIcon icon={faFont} />
        <FontAwesomeIcon icon={faHighlighter} /> */}
      </Toolbar>
    </div>

    <div className="overflow-auto h-[30rem] items-center  ">
      
        {pages.map((page, index) => (
          <div
            key={index}
            ref={index === pages.length - 1 ? lastPageRef : null}
            className="flex justify-center py-4 "
          >
            <div className="bg-white shadow-lg p-6 max-w-4xl border border-gray-200 flex flex-col">
              <input
                type="text"
                className="px-4 py-2 border mb-5"
                placeholder="Chapter Name"
                value={page.name}
                onChange={(e) => updatePageName(index, e.target.value)}
              />
              <Editor
                containerProps={{ className: "h-96 p-4 border w-[15rem] overflow-auto" }}
                value={page.content}
                
                onChange={(e) => updatePageContent(index, e.target.value)}
                
              />
              <p className="text-sm text-gray-500 text-right">{index + 1}</p>
            </div>
          </div>
        ))}
      
    </div>

    <div className="flex flex-col items-end space-y-4 sm:mr-5">
      {pages.length > 1 && (
        <>
          <button
            className="-mt-32 px-4 py-2 bg-red-500 text-white rounded"
            onClick={deletePage}
            data-tooltip-id="delete"
            data-tooltip-content="delete last page"
            data-tooltip-place="top"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <Tooltip id="delete" />
        </>
      )}
      <button
        className="px-4 py-2 bg-blue-500 shadow-lg text-white rounded-lg"
        onClick={addPage}
        data-tooltip-id="addPage"
        data-tooltip-content="Add Page"
        data-tooltip-place="top"
      >
        <FontAwesomeIcon icon={faAdd} />
      </button>
      <Tooltip id="addPage" />
    </div>
  </div>
  </EditorProvider>
);
}

export default BookEditor;