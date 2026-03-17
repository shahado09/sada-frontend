import { useState } from "react";
import GenerateImageSection from "../GenerateImage/GenerateImageSection";
import GenerateVideoSection from "../GenerateVideo/GenerateVideoSection";
import styles from "./GeneratePageTabs.module.css";

export default function GeneratePageTabs({ category }) {
  const [tab, setTab] = useState("image");

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === "image" ? styles.tabActive : styles.tab}
          onClick={() => setTab("image")}
        >
          Images
        </button>
        <button
          type="button"
          className={tab === "video" ? styles.tabActive : styles.tab}
          onClick={() => setTab("video")}
        >
          Videos
        </button>
      </div>

      <div className={styles.body}>
        {/* ✅ كلا الكومبوننتين mounted دائماً — بس نخفي الغير نشط */}
        <div style={{ display: tab === "image" ? "block" : "none" }}>
          <GenerateImageSection category={category} />
        </div>
        <div style={{ display: tab === "video" ? "block" : "none" }}>
          <GenerateVideoSection category={category} />
        </div>
      </div>
    </div>
  );
}
