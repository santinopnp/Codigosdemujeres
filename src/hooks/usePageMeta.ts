import { useEffect } from "react";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const suffix = " | CÓDIGOS";
    document.title = title.includes("CÓDIGOS") ? title : title + suffix;
    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (meta) meta.content = description;
    }
  }, [title, description]);
}
