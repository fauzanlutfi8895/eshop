import React, { useRef, useState, useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";
import ReactQuill from "react-quill-new";

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (content: string) => void;
}) => {
  const [editorValue, setEditorValue] = useState(value || "");
  const quillRef = useRef<ReactQuill | null>(null);

  //   useEffect(() => {
  //     if (!quillRef.current) {
  //       quillRef.current = true; //Mark as mounted

  //       //Ensure only one toolbar is present
  //       setTimeout(() => {
  //         document.querySelectorAll(".ql-toolbar").forEach((toolbar, index) => {
  //           if (index > 0) {
  //             toolbar.remove(); //remove extra toolbars
  //           }
  //         });
  //       }, 100); //short delay ensure Quill is fully initialized
  //     }
  //   }, []);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ font: [] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="relative">
      {/* No Duplicate Quill instance */}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorValue}
        onChange={(content) => {
          setEditorValue(content);
          onChange(content);
        }}
        modules={modules}
        placeholder="Write a detailed product description here..."
        className="bg-transparent border border-gray-700 text-white rounded-md"
        style={{
          minHeight: "250px",
        }}
      />

      <style>
        {`
            .ql-toolbar {
            background: transparent; /* Dark toolbar */
            border-color: #444;
            }

            .ql-container {
            background: transparent !important;
            border-color: #444;
            color: white; /* Text color inside editor */
            }

            .ql-picker {
            color: white !important;
            }

            .ql-editor {
            min-height: 200px; /* Adjust editor height */
            }

            .ql-snow {
            border-color: #444 !important;
            }
            .ql-editor.ql-blank::before {
            color: #aaa !important; /* Placeholder color */
            }

            .ql-picker-options {
            background: #333 !important; /* Fix dropdown color */
            color: white !important;
            }

            .ql-picker-item {
            color: white !important;
            }

            .ql-stroke {
            stroke: white !important;
            }
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;
