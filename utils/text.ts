export const getFirstWord = (s?: string) => {
    if (!s) return "";
    const clean = s.trim().replace(/\s+/g, " ");
    return clean.split(" ")[0] || "";
  };
  