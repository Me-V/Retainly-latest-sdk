// components/LatexView.tsx
import React from "react";
import { WebView } from "react-native-webview";
import { Platform } from "react-native";

type Props = {
  latex: string;
  color?: string;
  style?: any;
};

export default function LatexView({ latex, color = "#000000", style }: Props) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        
        <style>
          body {
            margin: 0;
            padding: 16px;
            color: ${color};
            font-family: -apple-system, Roboto, sans-serif;
            font-size: 18px;
            line-height: 1.6;
            background: transparent;
          }
          /* Make math big enough to read */
          .katex { font-size: 1.1em; }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
      </head>
      <body>
        <div id="content">${latex}</div>

        <script>
          document.addEventListener("DOMContentLoaded", function() {
            if (window.renderMathInElement) {
              renderMathInElement(document.body, {
                delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '\\\\[', right: '\\\\]', display: true},
                  {left: '$', right: '$', display: false},
                  {left: '\\\\(', right: '\\\\)', display: false}
                ],
                throwOnError : false
              });
            }
            
            // Send height to React Native
            setTimeout(function() {
              var height = document.body.scrollHeight;
              window.ReactNativeWebView.postMessage(height);
            }, 500);
          });
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      style={[{ backgroundColor: "transparent", minHeight: 100 }, style]}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      // Fix for Android opacity issues
      opacity={0.99}
      androidLayerType={Platform.OS === "android" ? "hardware" : "none"}
    />
  );
}
