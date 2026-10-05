"use client";
/** Last-resort boundary (root layout failed). Uses inline styles: no CSS is guaranteed here. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0B1120", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ color: "#5CE3B6", fontWeight: 700, letterSpacing: 1, fontSize: 12 }}>GSIC HUB</p>
          <h1 style={{ margin: "12px 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#CBD5E1", margin: 0 }}>Reload the page to try again.</p>
          <button onClick={reset} style={{ marginTop: 20, background: "#3352CD", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
