import React, { useState } from "react";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function upload(endpoint: string) {
    if (!file) return;
    setMsg("Uploading...");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: form });
    if (!res.ok) {
      const t = await res.text();
      setMsg(`Error: ${t}`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setMsg(`Done → ${endpoint} (${blob.size} bytes)`);
    // For demo, download result
    const a = document.createElement("a");
    a.href = url;
    a.download = endpoint.includes("xkt") ? "model.xkt" : "model.gltf";
    a.click();
  }

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>IFC Conversion Demo</h1>
      <input type="file" accept=".ifc" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div style={{ marginTop: 12 }}>
        <button onClick={() => upload("/api/convert/ifc-to-xkt")} disabled={!file}>
          Convert to XKT (xeokit)
        </button>
        <button onClick={() => upload("/api/convert/ifc-to-gltf")} disabled={!file} style={{ marginLeft: 8 }}>
          Convert to glTF (IfcConvert)
        </button>
      </div>
      <p>{msg}</p>
      <p style={{ opacity: 0.7 }}>
        Tip: Vite proxies <code>/api</code> → <code>{import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}</code>
      </p>
    </div>
  );
}
