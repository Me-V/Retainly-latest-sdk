import React, { useState } from "react";
import { WebView } from "react-native-webview";
import { View, Platform } from "react-native";

type Props = {
  latex: string;
  color?: string;
  style?: any;
};

export default function LatexView({ latex, color = "#000000", style }: Props) {
  const [size, setSize] = useState({ height: 0, width: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const escapedLatex = latex.replace(/\\/g, "\\\\");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        
        <style>
          * { margin: 0; padding: 0; }
          
          body, html {
            background: transparent;
            /* 🟢 inline-flex is the most robust way to shrink-wrap content */
            display: inline-flex; 
            height: auto;
            overflow: hidden;
          }

          #content {
            color: ${color};
            font-family: -apple-system, Roboto, sans-serif;
            font-size: 21px;
            line-height: 1.8;
            /* 🟢 Prevent any line breaks */
            white-space: nowrap; 
            padding-top: 4px;
          }
          
          .katex { font-size: 1.0em; margin: 0; }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
      </head>
      <body>
        <span id="content"></span>

        <script>
          try {
            katex.render("${escapedLatex}", document.getElementById('content'), {
              displayMode: false,
              throwOnError: false
            });
          } catch(e) {
            document.getElementById('content').innerText = "Err";
          }

          function sendSize() {
            var body = document.body;
            // 🟢 Measure the body directly since it's inline-flex
            var width = body.scrollWidth;
            var height = body.scrollHeight;

            window.ReactNativeWebView.postMessage(JSON.stringify({
              width: width,
              height: height
            }));
          }

          setTimeout(sendSize, 10);
          setTimeout(sendSize, 100);
        </script>
      </body>
    </html>
  `;

  return (
    <View
      style={[
        style,
        {
          height: size.height,
          width: size.width,
          alignSelf: "center",
          backgroundColor: "transparent",
          // Only show once we have a valid width to prevent jumping
          display: size.width > 0 ? "flex" : "none",
        },
      ]}
    >
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: "transparent" }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.width && data.height) {
              setSize({
                width: data.width,
                height: data.height,
              });
              setIsLoaded(true);
            }
          } catch (e) {}
        }}
        opacity={isLoaded ? 0.99 : 0}
        androidLayerType={Platform.OS === "android" ? "hardware" : "none"}
      />
    </View>
  );
}
