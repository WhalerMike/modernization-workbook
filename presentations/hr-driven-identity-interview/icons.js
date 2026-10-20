// Render the deck's icons to white-on-transparent PNGs (placed on coloured circles in the deck).
const fs = require("fs");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");

const NAMES = ["FaArrowsRotate", "FaLandmark", "FaLightbulb", "FaDoorOpen", "FaDoorClosed", "FaBook",
  "FaUserClock", "FaArrowDownWideShort", "FaUserXmark", "FaCubes", "FaHashtag", "FaTableList",
  "FaIdCard", "FaShieldHalved", "FaKey", "FaScaleBalanced", "FaFilter", "FaFileShield", "FaLock",
  "FaSitemap", "FaClipboardCheck", "FaPlugCircleXmark", "FaListCheck", "FaTriangleExclamation",
  "FaChartLine", "FaCodeBranch", "FaUserShield", "FaBuildingColumns", "FaPeopleArrows", "FaFingerprint", "FaCloudArrowUp", "FaGlobe", "FaBuilding", "FaRoute", "FaServer", "FaDatabase", "FaLaptop", "FaAddressBook", "FaUserTie", "FaRightLeft", "FaCloud", "FaUserCheck", "FaUsersGear"];

(async () => {
  const out = path.join(__dirname, "icons");
  fs.mkdirSync(out, { recursive: true });
  const missing = NAMES.filter((n) => !fa[n]);
  if (missing.length) { console.error("missing:", missing.join(", ")); process.exit(1); }
  for (const n of NAMES) {
    const svg = renderToStaticMarkup(React.createElement(fa[n], { color: "#FFFFFF", size: 256 }));
    await sharp(Buffer.from(svg)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(out, n + ".png"));
  }
  console.log("rendered", NAMES.length);
})();
