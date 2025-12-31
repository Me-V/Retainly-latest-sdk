// components/LatexView.tsx
import React from "react";
import { WebView } from "react-native-webview";

type Props = {
  latex: string;
  inline?: boolean;
  color?: string;
};

export default function LatexView({
  latex,
  inline = false,
  color = "#000000",
}: Props) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
    />
    <style>
      body {
        margin: 0;
        padding: 8px;
        background: transparent;
      }
      .katex {
        color: ${color};
      }
    </style>
  </head>
  <body>
    <div id="math"></div>
  </body>
</html>
`;

  const injectedJavaScript = `
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
    script.onload = function () {
      katex.render(
        ${JSON.stringify(latex)},
        document.getElementById("math"),
        { displayMode: ${!inline} }
      );
    };
    document.head.appendChild(script);
    true;
  `;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      injectedJavaScript={injectedJavaScript}
      scrollEnabled={false}
      style={{
        height: inline ? 60 : 120, // 🔴 REQUIRED
        backgroundColor: "transparent",
      }}
    />
  );
}
