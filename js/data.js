/* nailhae — Book N°03 content.
   Everything a visitor reads lives here; the layout and motion code only reads from it.
   To swap a photo, replace img/{l,m,s,b}/NN.webp (1050, 640, 360 and 48px wide, 3:4). */
(function () {
  const S = (id, name, shape, work, alt) => ({ id, name, shape, work, alt });

  const sets = [
    S("01", "Ink Crosses", "Short", "Hand-painted", "Short natural nails with small black hand-painted crosses on tattooed hands"),
    S("02", "Liquid Glass", "Almond", "Chrome", "Long almond nails in clear gel with liquid silver chrome edges"),
    S("03", "Black Mirror", "Short", "Chrome, hand-painted", "Short smoky nails with black chrome and fine painted symbols on tattooed hands"),
    S("04", "Rose Smoke", "Stiletto", "Aura, hand-painted", "Pink stiletto nails with a smoky aura and painted burgundy dots"),
    S("05", "Onyx Facet", "Almond", "Chrome, 3D", "Almond nails mixing black chrome diamonds and sheer nude, worn with silver rings"),
    S("06", "Mercury", "Stiletto", "Chrome, 3D", "Silver mirror-chrome stilettos and black 3D charms, hands crossed over a cross necklace"),
    S("07", "Bone Cross", "Stiletto", "Hand-painted", "Long nude stilettos with tiny black crosses and dotted lines"),
    S("08", "Silver Relief", "Stiletto", "Chrome, 3D", "Stiletto nails covered in raised silver chrome relief"),
    S("09", "Milk French", "Almond", "French", "Sheer almond nails with soft milky French tips"),
    S("10", "Night Garden", "Short", "Hand-painted", "Short dark nails with small painted flowers and a red heart"),
    S("11", "Dalmatian Glass", "Almond", "Hand-painted", "Clear almond nails with glossy black dalmatian spots"),
    S("12", "Pearl Bloom", "Almond", "3D, chrome", "Almond nails with a white 3D flower and silver chrome details"),
    S("13", "Gunmetal", "Short", "Chrome", "Short smoky chrome nails worn with heavy silver rings and a watch"),
    S("14", "Garnet", "Short", "Jewels", "Short nails set with deep red jewels and silver chrome"),
    S("15", "Smoke Lines", "Almond", "Hand-painted", "Sheer almond nails with thin black line art"),
    S("16", "Ribbon Script", "Almond", "Hand-painted", "Nude almond nails with white painted ribbons and loops"),
    S("17", "Ice Charm", "Stiletto", "Charms", "Icy blue stilettos with small silver charms"),
    S("18", "Blue Bloom", "Stiletto", "3D", "Long white stilettos with pale blue 3D cross-flowers"),
    S("19", "Lace Chrome", "Stiletto", "Chrome, 3D", "Clear stilettos with chrome swirls like lace"),
    S("20", "Wave Glass", "Stiletto", "Chrome", "Long clear stilettos with white and silver waves and crystals"),
    S("21", "Chrome Current", "Stiletto", "Chrome, 3D", "Stilettos outlined in thick molten silver chrome over pink gel"),
    S("22", "Veil Cross", "Almond", "French, hand-painted", "Pale blue French almond nails with white crosses"),
    S("23", "Charm Line", "Almond", "Charms", "White French almond nails with a row of silver charms"),
    S("24", "Acid Lime", "Short", "Gel, hand-painted", "Short nails in acid lime gel with black spots and a chrome accent"),
    S("25", "Moon Short", "Short", "Chrome, hand-painted", "Short nails with chrome dots, a white cross and a moon"),
    S("26", "Frost Bloom", "Stiletto", "3D, aura", "Pale stilettos with frosted white flowers and a pink aura"),
    S("27", "Ember", "Short", "Chrome", "Short nails with orange and red chrome pools on a dark background"),
    S("28", "Pearl Drip", "Almond", "3D", "White almond nails with dripping pearl 3D detail"),
    S("29", "Glass Flame", "Stiletto", "3D, chrome", "Clear stilettos with white chrome flames"),
    S("30", "Bare Glint", "Almond", "Chrome", "Bare almond nails with a thin silver glint at the tips"),
    S("31", "Ice Stiletto", "Stiletto", "3D", "Clear ice-white stilettos with sculpted 3D ridges"),
    S("32", "Veil French", "Almond", "French, hand-painted", "Long almond nails with soft white French and white crosses"),
    S("33", "Steel Short", "Short", "Chrome", "Short steel chrome nails with silver rings"),
    S("34", "Cobalt Script", "Almond", "Hand-painted", "Clear almond nails with cobalt blue hand-painted letters"),
    S("35", "Smoke Quartz", "Almond", "Marble", "Almond nails in grey smoke-quartz marble"),
    S("36", "Plum Spots", "Short", "Hand-painted", "Short plum nails with leopard spots")
  ];

  const byId = Object.fromEntries(sets.map((s) => [s.id, s]));

  window.NAILHAE = {
    ig: "nailhae_",
    sets,
    byId,
    // Cover slideshow: one every 4 seconds, in this order. Chrome-heavy sets read best behind the type.
    heroSlides: ["06", "21", "08", "20", "05", "19", "31", "29"],
    finale: "21",
    finaleSide: ["32", "20"],
    // Orbit: art-directed, not a grid. d = depth (-1 far … 1 near), m = radius multiplier, r = tilt in degrees,
    // w = width in vw. sx/sy/sr place it when motion is off.
    orbit: [
      { id: "24", d: 0.6, m: 1.0, r: -12, w: 9.5, sx: 22, sy: 18, sr: -8 },
      { id: "11", d: -0.6, m: 0.92, r: 9, w: 7.5, sx: 74, sy: 14, sr: 9 },
      { id: "34", d: 0.2, m: 1.08, r: -4, w: 10.5, sx: 86, sy: 46, sr: -4 },
      { id: "27", d: -0.9, m: 0.88, r: 14, w: 7, sx: 70, sy: 80, sr: 12 },
      { id: "04", d: 0.9, m: 1.05, r: -9, w: 11, sx: 30, sy: 82, sr: -10 },
      { id: "18", d: -0.3, m: 0.96, r: 6, w: 8, sx: 10, sy: 52, sr: 6 },
      { id: "14", d: 0.4, m: 1.12, r: 11, w: 9, sx: 48, sy: 6, sr: 4 },
      { id: "10", d: -0.8, m: 0.9, r: -15, w: 7, sx: 52, sy: 92, sr: -6 }
    ],
    // The horizontal contact sheet. Everything not used above.
    gallery: [
      "01", "02", "03", "05", "07", "08", "09", "12", "13", "15", "16", "17",
      "19", "22", "23", "25", "26", "28", "29", "30", "31", "33", "35", "36"
    ],
    // Orbit headline: blocks → lines → segments. Lines are dark chrome; `ink` segments are flat black.
    orbitText: [
      [[{ t: "nail(hae)" }]],
      [[{ t: "Bare Nail" }], [{ t: "Liquid Chrome" }], [{ t: "HAND-PAINTED" }]]
    ],
    // Studio pricing, carried over from the current site (updated May 1).
    pricing: {
      services: [
        { id: "gelx", name: "Gel X", price: 100, note: "X-short included", lengths: true },
        { id: "dry", name: "Gel polish dry manicure", price: 90 },
        { id: "soft", name: "Soft gel overlay", price: 100 },
        { id: "builder", name: "Builder gel", price: 110 }
      ],
      lengths: [
        { id: "xs", name: "X-short", price: 0 },
        { id: "s", name: "Short", price: 10 },
        { id: "m", name: "Medium", price: 20 },
        { id: "l", name: "Long", price: 30 }
      ],
      art: [
        { id: "none", name: "No art", price: 0 },
        { id: "t1", name: "Tier 1", price: 20, note: "Ombré, single color aura, cat eye" },
        { id: "t2", name: "Tier 2", price: 30, note: "French tip, two color aura, one color chrome" },
        { id: "t3", name: "Tier 3", price: 50, note: "3D, isolated chrome, isolated caviar beads" },
        { id: "t4", name: "Tier 4 *Freestyle", price: 60, note: "Hand painting, chrome on 3D, isolated jewels/beads" }
      ],
      extras: [
        { id: "soak", name: "Foreign set soak off", price: 30 },
        { id: "repair", name: "Single nail length repair", price: 15 }
      ],
      fees: [
        { name: "15 min late fee", price: "+$20" },
        { name: "After hours appointment", price: "$150" },
        { name: "Off days appointment", price: "$200" }
      ]
    }
  };
})();
