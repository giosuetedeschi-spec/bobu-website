"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";
import theme from "@/lib/theme";

export function ThemeRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "mui" });
    cache.compat = true;
    const insert = cache.insert;
    let inserted: string[] = [];

    cache.insert = (...args) => {
      const name = args[1].name;
      if (cache.inserted[name] === undefined) inserted.push(name);
      return insert(...args);
    };

    const flush = () => {
      const names = inserted;
      inserted = [];
      return names;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    const styles = names.map((name) => {
      const style = cache.inserted[name];
      return typeof style === "string" ? style : "";
    }).join("");

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
