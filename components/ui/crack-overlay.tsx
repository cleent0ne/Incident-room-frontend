/**
 * CrackOverlay — decorative SVG crack effect on the viewport edges.
 * - Fixed position, z-index 9999, pointer-events: none
 * - No JS, no animations, no masks — just static SVG paths
 */
export function CrackOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.22">
        {/* === TOP-LEFT corner === */}
        {/* Primary crack — runs deep into page */}
        <polyline
          points="0,0 22,8 15,28 38,20 30,58 72,40 58,86 108,62 88,128 152,96 126,175 200,138 168,220 260,180 220,280"
          fill="none" stroke="#8a8a90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Branch 1 */}
        <polyline
          points="0,0 8,42 28,32 20,76 52,58 40,112 80,88 62,152 108,122 86,196 136,162 110,240"
          fill="none" stroke="#7a7a80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Branch 2 */}
        <polyline
          points="0,30 18,24 14,56 34,44 28,90 56,74 46,128 84,104 70,168 114,140"
          fill="none" stroke="#6a6a70" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Hairlines */}
        <line x1="0" y1="10" x2="180" y2="90" stroke="#909095" strokeWidth="0.8" />
        <line x1="10" y1="0" x2="96" y2="150" stroke="#808085" strokeWidth="0.7" />
        <line x1="0" y1="22" x2="220" y2="118" stroke="#707075" strokeWidth="0.6" />
        <line x1="22" y1="0" x2="140" y2="200" stroke="#606065" strokeWidth="0.5" />

        {/* === TOP-RIGHT corner === */}
        <polyline
          points="1440,0 1416,8 1424,28 1400,20 1408,58 1366,40 1380,86 1328,62 1350,128 1284,96 1312,175 1238,138 1270,220 1178,180 1218,280"
          fill="none" stroke="#8a8a90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="1440,0 1430,42 1410,32 1418,76 1386,58 1398,112 1358,88 1376,152 1328,122 1352,196 1302,162 1328,240"
          fill="none" stroke="#7a7a80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="1440,30 1420,24 1424,56 1404,44 1410,90 1382,74 1392,128 1354,104 1368,168 1322,140"
          fill="none" stroke="#6a6a70" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"
        />
        <line x1="1440" y1="10" x2="1258" y2="92" stroke="#909095" strokeWidth="0.8" />
        <line x1="1428" y1="0" x2="1342" y2="152" stroke="#808085" strokeWidth="0.7" />
        <line x1="1440" y1="24" x2="1218" y2="120" stroke="#707075" strokeWidth="0.6" />
        <line x1="1416" y1="0" x2="1298" y2="202" stroke="#606065" strokeWidth="0.5" />

        {/* === BOTTOM-LEFT corner === */}
        <polyline
          points="0,900 22,890 15,870 38,878 30,840 72,858 58,812 108,836 88,770 152,802 126,722 200,760 168,678 260,718 220,618"
          fill="none" stroke="#8a8a90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="0,900 8,856 28,866 20,822 52,840 40,786 80,810 62,746 108,776 86,702 136,736 110,658"
          fill="none" stroke="#7a7a80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="0,868 18,874 14,842 34,854 28,808 56,824 46,770 84,794 70,730 114,758"
          fill="none" stroke="#6a6a70" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"
        />
        <line x1="0" y1="890" x2="182" y2="808" stroke="#909095" strokeWidth="0.8" />
        <line x1="10" y1="900" x2="98" y2="748" stroke="#808085" strokeWidth="0.7" />
        <line x1="0" y1="876" x2="222" y2="780" stroke="#707075" strokeWidth="0.6" />
        <line x1="22" y1="900" x2="142" y2="698" stroke="#606065" strokeWidth="0.5" />

        {/* === BOTTOM-RIGHT corner === */}
        <polyline
          points="1440,900 1416,890 1424,870 1400,878 1408,840 1366,858 1380,812 1328,836 1350,770 1284,802 1312,722 1238,760 1270,678 1178,718 1218,618"
          fill="none" stroke="#8a8a90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="1440,900 1430,856 1410,866 1418,822 1386,840 1398,786 1358,810 1376,746 1328,776 1352,702 1302,736 1328,658"
          fill="none" stroke="#7a7a80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="1440,868 1420,874 1424,842 1404,854 1410,808 1382,824 1392,770 1354,794 1368,730 1322,758"
          fill="none" stroke="#6a6a70" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"
        />
        <line x1="1440" y1="890" x2="1256" y2="810" stroke="#909095" strokeWidth="0.8" />
        <line x1="1428" y1="900" x2="1340" y2="750" stroke="#808085" strokeWidth="0.7" />
        <line x1="1440" y1="876" x2="1216" y2="782" stroke="#707075" strokeWidth="0.6" />
        <line x1="1416" y1="900" x2="1296" y2="700" stroke="#606065" strokeWidth="0.5" />

        {/* === TOP EDGE mid-cracks — longer runs === */}
        <polyline
          points="430,0 440,24 424,18 434,46 418,36 430,68 412,54 424,90 406,72 420,116 400,96 416,140"
          fill="none" stroke="#787880" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="720,0 734,22 718,16 730,44 714,32 728,70 712,56 726,96 708,78 722,126"
          fill="none" stroke="#787880" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="1010,0 1002,24 1018,18 1008,46 1024,36 1012,70 1028,56 1014,92 1030,74 1016,120"
          fill="none" stroke="#787880" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* === BOTTOM EDGE mid-cracks — longer runs === */}
        <polyline
          points="380,900 370,874 386,880 374,852 390,860 376,828 394,838 378,804 396,816 380,782 398,794 382,758"
          fill="none" stroke="#787880" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="720,900 732,876 716,882 728,854 712,862 724,830 708,840 722,806 706,818 720,784"
          fill="none" stroke="#787880" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="1060,900 1050,876 1066,872 1054,848 1070,856 1058,824 1074,832 1060,800 1076,810 1062,776"
          fill="none" stroke="#787880" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* === LEFT EDGE mid-cracks — longer runs === */}
        <polyline
          points="0,310 24,320 16,340 34,330 24,358 50,344 36,374 60,360 44,394 72,378 52,414 80,398 58,436"
          fill="none" stroke="#787880" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="0,590 22,580 14,600 32,590 22,614 46,602 32,630 56,618 38,650 64,636 42,668"
          fill="none" stroke="#787880" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* === RIGHT EDGE mid-cracks — longer runs === */}
        <polyline
          points="1440,310 1414,320 1422,340 1404,330 1414,358 1388,344 1402,374 1378,360 1394,394 1366,378 1386,414 1358,398 1380,436"
          fill="none" stroke="#787880" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="1440,590 1416,580 1424,600 1406,590 1416,614 1392,602 1406,630 1382,618 1400,650 1374,636 1396,668"
          fill="none" stroke="#787880" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        />
        </g>

        {/* Vignette: edge darkening */}
        <defs>
          <linearGradient id="vt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
            <stop offset="18%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vb" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
            <stop offset="18%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.22" />
            <stop offset="14%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vr" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.22" />
            <stop offset="14%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#vt)" />
        <rect width="1440" height="900" fill="url(#vb)" />
        <rect width="1440" height="900" fill="url(#vl)" />
        <rect width="1440" height="900" fill="url(#vr)" />
      </svg>
    </div>
  );
}
