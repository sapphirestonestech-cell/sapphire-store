// One-shot production seed via Helicarrier db_query (mirrors scripts/seed.ts).
(function () {
  db.__probe.deleteMany({});
  var now = new Date();

  var CATEGORIES = [
    { _id: ObjectId("6ad7a73eb7d39995cec281e3"), name: "Engagement Rings", slug: "engagement-rings", description: "Rings for the question that matters.", displayOrder: 1 },
    { _id: ObjectId("6ad7a73eb7d39995cec281e4"), name: "Female Rings", slug: "female-rings", description: "Everyday and statement rings.", displayOrder: 2 },
    { _id: ObjectId("6ad7a73eb7d39995cec281e5"), name: "Male Rings", slug: "male-rings", description: "Bands and signets built for daily wear.", displayOrder: 3 },
    { _id: ObjectId("6ad7a73eb7d39995cec281e6"), name: "Pre-order Collection", slug: "pre-order-collection", description: "Arriving soon — reserve yours now.", displayOrder: 4 },
  ];

  var LOCATIONS = [
    { _id: ObjectId("6ad7a73eb7d39995cec281e7"), country: "Nigeria", region: "Lagos", cityArea: "Lagos Island", instockFee: 8, preorderFee: 12, minDays: 2, maxDays: 5 },
    { _id: ObjectId("6ad7a73eb7d39995cec281e8"), country: "Nigeria", region: "FCT", cityArea: "Abuja", instockFee: 9, preorderFee: 13, minDays: 3, maxDays: 6 },
    { _id: ObjectId("6ad7a73eb7d39995cec281e9"), country: "Nigeria", region: "Rivers", cityArea: "Port Harcourt", instockFee: 10, preorderFee: 14, minDays: 3, maxDays: 7 },
    { _id: ObjectId("6ad7a73eb7d39995cec281ea"), country: "Ghana", region: "Greater Accra", cityArea: "Accra", instockFee: 18, preorderFee: 24, minDays: 5, maxDays: 10 },
    { _id: ObjectId("6ad7a73eb7d39995cec281eb"), country: "United Kingdom", cityArea: "London", instockFee: 22, preorderFee: 28, minDays: 6, maxDays: 12 },
    { _id: ObjectId("6ad7a73eb7d39995cec281ec"), country: "United States", region: "New York", cityArea: "New York City", instockFee: 25, preorderFee: 30, minDays: 7, maxDays: 14 },
  ];

  var locByArea = {};
  LOCATIONS.forEach(function (l) { locByArea[l.cityArea] = l._id; });

  var SETTINGS = [
    { key: "base_currency", value: "USD" },
    { key: "tagline", value: "Luxurious rings at an affordable price." },
    { key: "store_name", value: "Sapphire" },
    { key: "rounding", value: JSON.stringify({ usdDecimals: 2, ngnNearest: 50 }) },
  ];

  var PHOTOS = {
    "aurelia-solitaire": { cover: "On the hand", left: "On the hand", right: "On the hand", detail: "Close-up" },
    "vera-halo-ring": { cover: "On the hand", left: "On the hand", right: "On the hand", detail: "Close-up" },
    "liora-twist-band": { cover: "On the hand", left: "On the hand", right: "On the hand", detail: "Close-up" },
    "nadia-stone-drop": { cover: "On the hand", left: "On the hand", right: "On both hands", detail: "Close-up" },
    "kofi-signet": { cover: "On the hand", left: "On the hand", right: "On both hands", detail: "Close-up" },
    "tobi-grooved-band": { cover: "On the hand", left: "On the hand", right: "On the hand", detail: "Close-up" },
    "sienna-pav-eternity": { cover: "On the hand", left: "On the hand", right: "On the hand", detail: "On both hands" },
    "amara-trilogy": { cover: "On both hands", left: "Held in hand", right: "On the hand", detail: "Close-up" },
  };

  var PRODUCTS = [
    { name: "Aurelia Solitaire", slug: "aurelia-solitaire", type: "engagement", category: "6ad7a73eb7d39995cec281e3", shape: "Round", material: "Gold plated sterling silver", color: "Gold", basePrice: 68, compareAtPrice: 89, availability: "in_stock", isFeatured: true, freeDeliveryAll: true, freeDeliveryLocations: [], description: "A single brilliant-cut stone on a slender gold-plated band — quiet, classic, and made to be worn every day.", sizes: ["US 5", "US 6", "US 7", "US 8"] },
    { name: "Vera Halo Ring", slug: "vera-halo-ring", type: "engagement", category: "6ad7a73eb7d39995cec281e3", shape: "Oval", material: "Yellow gold vermeil", color: "Gold", basePrice: 92, availability: "in_stock", isFeatured: false, freeDeliveryAll: false, freeDeliveryLocations: ["Lagos Island", "Abuja"], description: "An oval centre stone ringed by a fine halo, set on a tapered vermeil band.", sizes: ["US 5", "US 6", "US 7", "US 8"] },
    { name: "Liora Twist Band", slug: "liora-twist-band", type: "female", category: "6ad7a73eb7d39995cec281e4", shape: "Interlocking", material: "Rose gold plated", color: "Rose gold", basePrice: 42, availability: "in_stock", isFeatured: true, freeDeliveryAll: false, freeDeliveryLocations: [], description: "Two smooth strands cross and settle into one another. Comfortable, stackable, and quietly sculptural.", sizes: ["US 5", "US 6", "US 7"] },
    { name: "Nadia Stone Drop", slug: "nadia-stone-drop", type: "female", category: "6ad7a73eb7d39995cec281e4", shape: "Marquise", material: "Gold plated brass", color: "Gold", basePrice: 55, compareAtPrice: 72, availability: "in_stock", isFeatured: false, freeDeliveryAll: false, freeDeliveryLocations: [], description: "A slim marquise stone drops just below the knuckle on a hammered gold band.", sizes: ["US 6", "US 7"] },
    { name: "Kofi Signet", slug: "kofi-signet", type: "male", category: "6ad7a73eb7d39995cec281e5", shape: "Signet", material: "Brushed stainless steel", color: "Silver", basePrice: 48, availability: "in_stock", isFeatured: false, freeDeliveryAll: false, freeDeliveryLocations: [], description: "A flat-top signet in brushed steel with a softly polished edge. Substantial without being heavy.", sizes: ["US 9", "US 10", "US 11", "US 12"] },
    { name: "Tobi Grooved Band", slug: "tobi-grooved-band", type: "male", category: "6ad7a73eb7d39995cec281e5", shape: "Band", material: "Gold plated titanium", color: "Gold", basePrice: 76, availability: "in_stock", isFeatured: false, freeDeliveryAll: false, freeDeliveryLocations: [], description: "A wide band with a single recessed groove running its full circumference.", sizes: ["US 9", "US 10", "US 11"] },
    { name: "Sienna Pavé Eternity", slug: "sienna-pav-eternity", type: "female", category: "6ad7a73eb7d39995cec281e6", shape: "Eternity", material: "Gold plated sterling silver", color: "Gold", basePrice: 84, availability: "pre_order", arrivalInDays: 45, paymentMode: "full", isFeatured: false, freeDeliveryAll: false, freeDeliveryLocations: [], description: "Micro-set stones run all the way around the band, so the sparkle never stops.", sizes: ["US 5", "US 6", "US 7", "US 8"] },
    { name: "Amara Trilogy", slug: "amara-trilogy", type: "engagement", category: "6ad7a73eb7d39995cec281e6", shape: "Trilogy", material: "Yellow gold vermeil", color: "Gold", basePrice: 110, availability: "pre_order", arrivalInDays: 60, paymentMode: "deposit", depositPercent: 40, isFeatured: true, freeDeliveryAll: false, freeDeliveryLocations: [], description: "Three graduated stones on a high-polish band — past, present, and what comes next.", sizes: ["US 6", "US 7", "US 8"] },
  ];

  CATEGORIES.forEach(function (c) {
    db.categories.replaceOne({ slug: c.slug }, {
      _id: c._id, name: c.name, slug: c.slug, description: c.description,
      displayOrder: c.displayOrder, isActive: true, createdAt: now, updatedAt: now,
    }, { upsert: true });
  });

  LOCATIONS.forEach(function (l) {
    db.deliverylocations.replaceOne({ country: l.country, region: l.region || null, cityArea: l.cityArea }, {
      _id: l._id, country: l.country, region: l.region, cityArea: l.cityArea,
      instockFee: l.instockFee, preorderFee: l.preorderFee, minDays: l.minDays, maxDays: l.maxDays,
      isActive: true, createdAt: now, updatedAt: now,
    }, { upsert: true });
  });

  SETTINGS.forEach(function (s) {
    db.settings.replaceOne({ key: s.key }, { key: s.key, value: s.value }, { upsert: true });
  });

  if (db.exchangerates.countDocuments() === 0) {
    db.exchangerates.insertOne({ usdToNgn: 1600, effectiveAt: now, createdAt: now });
  }

  var created = 0;
  var updated = 0;
  PRODUCTS.forEach(function (p) {
    var photos = PHOTOS[p.slug] || {};
    var views = ["cover", "left", "right", "detail"];
    var labels = { cover: "Cover", left: "Left hand", right: "Right hand", detail: "Detail" };
    var images = views.map(function (v, i) {
      return { url: "/seed/rings/" + p.slug + "-" + v + ".jpg", label: photos[v] || labels[v], position: i + 1 };
    });
    var isPre = p.availability === "pre_order";
    var isDeposit = isPre && p.paymentMode === "deposit";
    var sizes = p.sizes.map(function (label, i) {
      return { sizeLabel: label, stockQuantity: isPre ? 0 : 1 + ((i + 1) % 3) };
    });
    var doc = {
      name: p.name, slug: p.slug, description: p.description, type: p.type, shape: p.shape,
      material: p.material, color: p.color, basePrice: p.basePrice, compareAtPrice: p.compareAtPrice || null,
      availability: p.availability,
      preorderArrivalDate: isPre ? new Date(Date.now() + p.arrivalInDays * 24 * 60 * 60 * 1000) : null,
      preorderMaxQty: isPre ? 20 : null,
      paymentMode: isPre ? (p.paymentMode || "full") : "full",
      depositPercent: isDeposit ? p.depositPercent : null,
      freeDelivery: {
        allLocations: p.freeDeliveryAll || false,
        locationIds: (p.freeDeliveryLocations || []).map(function (a) { return locByArea[a]; }).filter(function (id) { return !!id; }),
      },
      status: "published", isFeatured: p.isFeatured || false,
      categories: [ObjectId(p.category)], images: images, sizes: sizes,
      createdAt: now, updatedAt: now,
    };
    var res = db.products.replaceOne({ slug: p.slug }, doc, { upsert: true });
    if (res.upsertedCount) created += 1; else updated += 1;
  });

  return {
    categories: db.categories.countDocuments(),
    locations: db.deliverylocations.countDocuments(),
    settings: db.settings.countDocuments(),
    rates: db.exchangerates.countDocuments(),
    products: { created: created, updated: updated, total: db.products.countDocuments() },
    adminusers: db.adminusers.countDocuments(),
  };
})()
