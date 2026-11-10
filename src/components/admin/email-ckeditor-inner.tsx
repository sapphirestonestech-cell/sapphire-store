"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  FileRepository,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  LinkImage,
  List,
  Paragraph,
  Plugin,
  Table,
  TableToolbar,
  Underline,
} from "ckeditor5";
import {
  getCloudinarySignature,
  uploadFileToCloudinary,
} from "@/lib/cloudinary-client";

interface FileLoaderLike {
  file: Promise<File | null>;
}

class CloudinaryUploadAdapter {
  constructor(private readonly loader: FileLoaderLike) {}

  async upload(): Promise<{ default: string }> {
    const file = await this.loader.file;
    if (!file) throw new Error("Choose an image to upload.");
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("That image is over 5 MB. Choose a smaller file.");
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Use a JPG, PNG or WebP image.");
    }
    const signature = await getCloudinarySignature("email");
    const uploaded = await uploadFileToCloudinary(file, signature);
    return { default: uploaded.url };
  }

  abort(): void {}
}

class UploadAdapterPlugin extends Plugin {
  init(): void {
    const repository = this.editor.plugins.get("FileRepository") as unknown as {
      createUploadAdapter: (loader: FileLoaderLike) => CloudinaryUploadAdapter;
    };
    repository.createUploadAdapter = (loader) =>
      new CloudinaryUploadAdapter(loader);
  }
}

export default function EmailCkeditorInner({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <div className="email-editor">
      <CKEditor
        id={id}
        editor={ClassicEditor}
        data={value}
        config={{
          licenseKey: "GPL",
          placeholder: "Write the email. Use the image button to upload a photo.",
          plugins: [
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Underline,
            Link,
            LinkImage,
            List,
            BlockQuote,
            Alignment,
            HorizontalLine,
            Image,
            ImageCaption,
            ImageStyle,
            ImageToolbar,
            ImageUpload,
            FileRepository,
            Table,
            TableToolbar,
          ],
          extraPlugins: [UploadAdapterPlugin],
          toolbar: [
            "undo",
            "redo",
            "|",
            "heading",
            "|",
            "bold",
            "italic",
            "underline",
            "|",
            "link",
            "uploadImage",
            "|",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "|",
            "alignment",
            "horizontalLine",
            "insertTable",
          ],
          image: {
            toolbar: [
              "imageTextAlternative",
              "toggleImageCaption",
              "|",
              "imageStyle:inline",
              "imageStyle:block",
              "|",
              "linkImage",
            ],
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: "https://",
          },
        }}
        onChange={(_event, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
