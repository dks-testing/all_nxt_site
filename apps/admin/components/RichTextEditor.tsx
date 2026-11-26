"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Editor } from "tinymce";
import { legacyRichTextHtml, richTextElements, richTextHtmlPrefix } from "@platform/db/rich-text";

const validElements = Object.entries(richTextElements).map(([tag, attributes]) =>
  attributes.length ? `${tag}[${attributes.join("|")}]` : tag,
).join(",");

export function RichTextEditor({ name, label, value, siteId, publicOrigin, className }: {
  name: string;
  label: string;
  value: string;
  siteId: string;
  publicOrigin: string;
  className: string;
}) {
  const id = useId();
  const target = useRef<HTMLTextAreaElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(value);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const textarea = target.current;
    const input = field.current;
    if (!textarea || !input) return;

    let disposed = false;
    let editor: Editor | undefined;
    const publish = (value: string) => {
      if (input.value === value) return;
      input.value = value;
      setContent(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };

    async function start() {
      try {
        const { default: tinymce } = await import("@/lib/tinymce");
        if (disposed || !textarea || !input) return;

        const current = input.value;
        textarea.value = current.startsWith(richTextHtmlPrefix)
          ? current.slice(richTextHtmlPrefix.length)
          : current ? legacyRichTextHtml(current) : "";

        await tinymce.init({
          target: textarea,
          license_key: process.env.NEXT_PUBLIC_TINYMCE_LICENSE_KEY || "gpl",
          height: 240,
          menubar: false,
          promotion: false,
          branding: false,
          iframe_aria_text: label,
          plugins: "lists link image code",
          toolbar: "undo redo | blocks | bold italic | bullist numlist | link image | code",
          block_formats: "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6",
          link_target_list: false,
          valid_elements: validElements,
          content_style: `
            .mce-content-body :is(h1, h2, h3, h4, h5, h6) {
              margin-block: 1em .5em;
              font-weight: 700;
              line-height: 1.25;
            }
            .mce-content-body h1 { font-size: 2em; }
            .mce-content-body h2 { font-size: 1.65em; }
            .mce-content-body h3 { font-size: 1.4em; }
            .mce-content-body h4 { font-size: 1.2em; }
            .mce-content-body h5 { font-size: 1.1em; }
            .mce-content-body h6 { font-size: 1em; }
            .mce-content-body > p:has(+ p) { margin-block-end: 1rem; }
            .mce-content-body > p + p { margin-block-start: 0; }
          `,
          document_base_url: new URL("/", publicOrigin).href,
          convert_urls: false,
          paste_data_images: false,
          paste_block_drop: true,
          images_file_types: "jpg,jpeg,png,gif,webp,avif",
          images_upload_handler: async (image) => {
            const data = new FormData();
            data.set("file", image.blob(), image.filename());
            const response = await fetch(`/api/sites/${siteId}/media`, { method: "POST", body: data });
            const result = await response.json().catch(() => null);
            if (!response.ok || typeof result?.asset?.url !== "string") {
              throw new Error(result?.error || "Image upload failed");
            }
            return result.asset.url;
          },
          setup(instance) {
            editor = instance;
            instance.once("init", () => {
              const initialHtml = instance.getContent();
              instance.on("input change undo redo", () => {
                const html = instance.getContent();
                publish(html === initialHtml ? current : html ? richTextHtmlPrefix + html : "");
              });
            });
          },
        });
      } catch {
        if (disposed || !textarea || !input) return;
        editor?.remove();
        textarea.value = input.value;
        setLoadError(true);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void start();
    });
    observer.observe(textarea);
    return () => {
      disposed = true;
      observer.disconnect();
      editor?.remove();
      textarea.value = input.value;
    };
  }, [label, publicOrigin, siteId]);

  return <div className={`min-w-0 ${className}`}>
    <label className="label" htmlFor={id}>{label}</label>
    <input ref={field} type="hidden" name={name} value={content} />
    <textarea ref={target} id={id} rows={5} className="input" defaultValue={value} onInput={(event) => {
      if (field.current) field.current.value = event.currentTarget.value;
      setContent(event.currentTarget.value);
    }} />
    {loadError && <p className="help" role="status">The rich text editor could not load.</p>}
  </div>;
}
