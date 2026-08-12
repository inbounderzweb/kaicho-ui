# kaicho.in — Live Site Content & Section Inventory

**Platform:** Shopify (theme served from `cdn.shopify.com` / `kaicho.in/cdn/shop/...`, standard `/collections/`, `/products/`, `/pages/`, `/blogs/`, `/policies/` routes, `data-shopify-*` markers). This is a hosted Shopify theme, not the Next.js codebase in this project — this document is a snapshot of the **live production site's** structure and content, for use as a reference/spec.

**Crawled pages:** Home · About Us · Products (collection) · one Product Detail page · B2B Sales · Contact Us · Blog listing.
**Not fetched in full** (linked but out of scope unless you want them too): individual blog posts (9 total), individual product pages (12 total, one sampled below), the 4 policy pages, `/account/login`, `/account/register`, `/pages/wishlist`, `/checkout`.

---

## 1. Global / Shared Components (present on every page)

| Component | Details |
|---|---|
| **Top utility strip** | Thin bar above the header (visible as a dark line in fetches — likely an announcement bar, content not resolved via static fetch) |
| **Header** | Logo (link to `/`) · primary nav · wishlist icon with count badge (`0`) · search toggle ("Enter your keywords") · cart. Header appears **twice in the DOM** (desktop + a duplicate small-logo variant) — typical Shopify theme pattern for responsive/mobile header swap |
| **Primary nav (homepage)** | Home · About · Blog · Products · B2B · Contact |
| **Primary nav (inner pages: About/Products/Contact)** | Home · About Us · Products · Blog · Contact Us — **note: order differs from homepage nav** (Blog and Products swap position, "About"→"About Us", "Contact"→"Contact Us") — an inconsistency across templates |
| **Primary nav (B2B page)** | Home · About Us · Products · Blog · Contact Us · **Business Store** (extra 6th item, only appears on the B2B page) |
| **Search overlay** | Full "Enter your keywords" search box, triggered from header icon |
| **Mini-cart / cart drawer** | "My Cart 0 items" |
| **Account modal** | Tabs for **Login** (email + password + "Forgot your Password?") and **Create your account** (email, first name, last name, password) + newsletter opt-in checkbox |
| **Wishlist toast** | "This item has been added to your Wishlist" confirmation with a "Go to wishlist" link, fires on heart-icon click |
| **Quick View / Add to Wishlist** | Present on every product card sitewide (hover actions) |
| **"Ask a Question" modal** | Appears on PDP — name/email/message form to contact support about a specific product |
| **"Notify Me" modal** | For out-of-stock products — email capture + ToS/Privacy consent checkbox |
| **Floating action buttons** | Fixed **Call Now** (`tel:+918792799631`) and **WhatsApp** (`https://wa.me/918792799631`) buttons, bottom corner, present sitewide |
| **Footer** | See §9 below — identical on every page |
| **Currency selector** | "India \| INR ₹" — single-currency, present but effectively static |

---

## 2. Homepage (`/`) — Section-by-Section

**Meta:** Title "Buy Healthy Ready-to-Eat Meals Online \| Kaicho Foods" · Description: "Shop healthy ready-to-eat millet and oats porridges from Kaicho Foods. High-fiber, protein-rich, preservative-free meals for busy lifestyles."

1. **Hero carousel / banner slider** — image-only slides (no visible overlaid text/CTA in the static HTML, meaning copy is likely baked into the banner images themselves, or rendered via JS not present in static markup). **10 banner images** load across two apparent breakpoint sets:
   - Desktop set (5 images, `width=2000`): `Webb_Banner-06`, a `WhatsApp_Image_2026-05-19`, `Webb_Banner-08`, `Webb_Banner-09`, `Webb_Banner-10`
   - Mobile/secondary set (5 images, `width=800`): `Webb_Banner-01`, another `WhatsApp_Image_2026-05-19`, `Webb_Banner-03`, `Webb_Banner-04`, `Webb_Banner-05`
   - This is very likely a **5-slide carousel with responsive (desktop vs. mobile) image variants per slide**, i.e. banner #1 has a desktop crop and a mobile crop, etc. — confirms the "banner is literally an image, not coded text" approach, unlike the redesigned version in this project.
2. **Marquee/ticker strip** — the 6 core claims, repeated **4 times in the markup** (classic infinite-scroll marquee implementation): `Diabetic-Friendly · Gut-Healthy Ingredients · No Preservatives · 100% Natural · High in Fiber & Protein · Japanese Retort Technology`
3. **Products section** — eyebrow **"PRODUCTS"**, heading **"Ready to Eat Meals"**, subheading **"Healthy, filling meals for busy lifestyles"**, then a 4-up product grid (see §6 for full product data), followed by two more un-headed rows using `<h3>`-level labels instead of a new section eyebrow:
   - **"Ready to Eat Combos"** — 4 products
   - **"Kaicho Family Saver Packs"** — 4 products
   - CTA button: **"Explore Our Meals →"** → `/collections/all`
4. **Story teaser** — kicker **"OUR STORY"**, heading **"KAICHO FOODS"**, one paragraph of brand copy (same first paragraph as the About page — see §3), links out to the full About page
5. **Video block** — "Press play and immerse yourself in video!" → embeds a YouTube Short (`youtube.com/shorts/ayPvshgGZuA`)
6. **B2B / bulk-order inline form** — heading **"Looking for Huge Quantity?"**, sub-copy "Planning a corporate order or need quantities above 10 packs? Share your requirement and our team will help you with the best bulk pricing." Fields: **Your Name\*, Your Email\*, Phone/WhatsApp Number\*, Quantity Required\*, Purpose/Use Case\*** (select: Corporate Order / Reselling / Event / Function / Restaurant / Catering / Other), **Additional message** (optional). Button: **"Submit Inquiry"**. *(This exact block is reused verbatim on the B2B page — see §5.)*
7. **"How it Works"** — heading **"Simple as Heat & Eat"**, 3 numbered steps: **01 Open the pack → 02 Heat the Product → 03 Enjoy your Meal**. *(Renders twice in the fetched markup — likely a duplicate desktop/mobile layout, same pattern as the banner carousel.)*
8. **"Where Kaicho Fits Into Your Day"** — sub-heading "Good food, ready when you need it." → "Whenever life gets busy, Kaicho is always ready." 8-card use-case grid, each numbered 01–08 with an image + title + one-line copy:
   1. **Road Trips** — "Easy to carry, perfect on the go."
   2. **Running Late for Office?** — "Just heat and eat before you leave."
   3. **Late Night Hunger?** — "Warm, filling meals anytime."
   4. **During Fever or Recovery** — "Light, comforting, and easy to eat."
   5. **Hostel & PG Life** — "Simple meals without cooking hassle."
   6. **Travel & Staycations** — "Easy to store and carry anywhere."
   7. **Busy Family Days** — "Simple meals for packed routines."
   8. **Work From Home** — "Quick meals between meetings."
9. **Testimonials** — eyebrow **"TESTIMONIALS"**, heading **"What Our Customers Say"**, 5 written reviews (no visible star rating in static markup), each with photo, quote, name, and city:
   - Suresh Krishna — Kannur, Kerala
   - Priya Ramesh — Bangalore, Karnataka
   - Arun Prakash — Chennai, Tamil Nadu
   - Meera Nair — Bangalore, Karnataka
   - Raghav Menon — Kochi, Kerala
   *(All 5 quotes are transcribed in the raw fetch if you want the literal copy — happy to pull them into this doc verbatim on request.)*
10. **Blog teaser** — eyebrow **"LATEST NEWS"**, heading **"Our Blog"**, 7 post cards (image, date, title, excerpt, "Read more" link) — see §8 for the full post list.
11. **Footer** — see §9.

---

## 3. About Us (`/pages/about-us`)

**Meta:** Title "About Us" · OG description "KAICHO FOODS"

1. **Breadcrumb**: Home / About Us
2. **Intro block** — heading **"Welcome to our store"**, three paragraphs:
   - Brand mission paragraph (culture/care/connection — verbatim identical to the homepage story teaser)
   - The **"Kaicho" name-origin story**: *"Our name, Kaicho, comes from a colloquial Malayalam phrase meaning 'Did you eat?' — a heartfelt question that reflects warmth, hospitality, and genuine concern."*
   - Quality-commitment paragraph ("Unlike many brands that compromise on quality or taste, we never plan or produce anything unhealthy...")
   - Product image: `About-us-product.png`
3. **Mission** — icon + heading **"Mission"** + one paragraph (health, culture, care; traditional wisdom + modern food tech)
4. **Vision** — icon + heading **"Vision"** + one paragraph — notably states an ambition to become *"a comprehensive food company... offering packaged foods to cafés, restaurants, and cloud kitchens — all under one trusted brand"*
5. **"Our Values"** — 6 value cards, icon + title + 1–2 sentence description:
   - **Transparency** — open/honest about ingredients, processes, practices
   - **Quality** — highest standards from sourcing to packaging
   - **Health-First** — genuinely healthier without compromising flavor
   - **Innovation** — modern food technology, creative convenience
   - **Sustainability** — environmental/community responsibility
   - **Care** — "Did you eat?" spirit — food as love, warmth, connection
6. **"Our Promise"** — one closing paragraph restating the health-first, transparency, trust commitment
7. **Footer**

---

## 4. Products / Collection Page (`/collections/all`)

**Meta:** Title "Products"

1. **Breadcrumb**: Home / Products
2. **Filter/sort sidebar**:
   - Sort dropdown: Featured · Most relevant · Best selling · Alphabetically A-Z/Z-A · Price low-high/high-low · Date old-new/new-old
   - **Availability filter**: In stock (12) · Out of stock (0) — with counts
   - **Price range filter**: slider, ₹0–₹1800 (step markers at 450/900/1350)
   - "Clear All" reset link
3. **View toggle**: Grid-3 / Grid-2 / List view icons
4. **Product grid** — **all 12 SKUs**, "Showing 12 of 12 products" (full catalog table in §6)
5. **Trust strip** (3 icons, under the grid): **Free Delivery** ("Free delivery on orders above 300 only.") · **Dedicated Support** ("Support 24 hours a day, 7 days a week.") · **Return Policy** ("Raise your return/replacement request within 48 hrs")
6. **"Recently Viewed Products"** — empty-state placeholder section (populates via browser storage/JS)
7. **Footer**

---

## 5. B2B Sales (`/pages/b2b-sales`)

**Meta:** Title "B2B Healthy Meal Supply for Clinics & Wellness Centres \| Kaicho" · Description: "Kaicho offers bulk healthy meal and porridge supply for clinics, wellness centres, and healthcare professionals looking for trusted nutrition solutions."

This page is essentially **one block**: breadcrumb (Home / B2B Sales) + the exact same **"Looking for Huge Quantity?"** inquiry form described in §2.6 (heading, sub-copy, all 5 fields, Submit Inquiry button) + footer. Notably the page's SEO metadata promises a much richer page (clinics, wellness centres, healthcare professionals) than what's actually built — **the live page is just the lead-gen form, no dedicated B2B content, pricing tiers, or case studies.**

---

## 6. Full Product Catalog (from `/collections/all` — the authoritative list of all 12 SKUs)

| Product | Handle | Price | Was | Discount | Stock |
|---|---|---|---|---|---|
| Chicken Oats Porridge (single) | `chicken-oats-bulk-pack-of-10` | ₹210 | ₹230 | -8% | In stock |
| Chicken Oats Bulk Pack (10 Packs) | `chicken-oats-bulk-pack-10-packs` | ₹1,800 | ₹2,300 | -21% | In stock |
| Complete Ready-to-Eat Meal Bundle | `all-in-one-combo-complete-kaicho-collection` | ₹680 | ₹830 | -18% | In stock |
| Kaicho Ready-to-Eat Millet Duo | `navadhanya-mixed-millet-combo` | ₹320 | ₹380 | -15% | In stock |
| Kaicho Veg & Chicken Oats Combo | `premium-trial-combo-veg-chicken-oats` | ₹380 | ₹450 | -15% | In stock |
| Kaicho Vegetarian Power Pack | `veg-trial-combo-millet-oats-collection` | ₹500 | ₹600 | -16% | In stock |
| Mixed Millet Bulk Pack (10 Packs) | `mixed-millet-bulk-pack-10-packs` | ₹1,500 | ₹1,900 | -21% | In stock |
| Mixed Millet Porridge | `mixed-millet-porridge` | ₹170 | ₹190 | -10% | In stock |
| Navadhanya Bulk Pack (10 Packs) | `navadhanya-bulk-pack-10-packs` | ₹1,500 | ₹1,900 | -21% | In stock |
| Navadhanya Porridge | `navadhanya-kanji` | ₹170 | ₹190 | -10% | In stock |
| Veg Oats Bulk Pack (10 Packs) | `veg-oats-bulk-pack-10-packs` | ₹1,750 | ₹2,200 | -20% | In stock |
| Veg Oats Porridge (single) | `veg-oats-bulk-pack-of-10` | ₹200 | ₹220 | -9% | In stock |

Each card also shows: category tags (**100% Natural \| No Preservatives**), a short 2–3 line description excerpt, "Add to cart" (with a "✓ Added to cart" success state), and a "Select Options → Select Title → Default Title" variant picker (every product currently has only one variant, "Default Title" — the variant-picker UI exists but isn't functionally used yet).

**⚠️ Data inconsistency found:** the **homepage** product cards show different prices than the **collection page** for the same underlying products — e.g. Veg Oats Porridge is ₹180/₹220 (-18%) on the homepage but ₹200/₹220 (-9%) on `/collections/all`; Mixed Millet Porridge is ₹140/₹190 (-26%) on the homepage vs. ₹170/₹190 (-10%) on the collection page; similar gaps on the Millet Duo, Veg & Chicken Combo, and Navadhanya Bulk Pack. This looks like the homepage is pulling a cached/stale product-card snippet while `/collections/all` reflects current pricing — worth knowing if you're using this as a data source, and worth fixing on the live store regardless since it's a real "which price is correct" trust issue for customers.

### Product Detail Page template (sampled: Veg Oats Porridge, `/products/veg-oats-bulk-pack-of-10`)

1. **Breadcrumb**: Home / \[Product Name]
2. **Image gallery** — 9 thumbnails (mixes bulk-pack photography and individual product shots — likely a gallery-management inconsistency, since a "single pack" PDP is showing bulk-pack imagery first)
3. **Title** + **"View All Reviews"** anchor link (jumps to a reviews app block — likely Air Reviews per the `AirReviews-BlockWrapper` anchor id)
4. **Price** — strikethrough original + sale price + discount badge (`~~₹220.00~~ ₹200.00 -9%`)
5. **Short description** (one line)
6. **Category tags** — links to the collections this product belongs to (e.g. "home", "oats collection")
7. **Variant selector** ("Default Title" only currently) + **Quantity stepper** + **"Add to bag"** button
8. **Share** row + **"Ask a Question"** link
9. **"Guaranteed safe checkout"** payment-icon trust badge
10. **Description tab** — expandable, full copy + bullet list of highlights
11. **Social share icons** (Facebook / Twitter / Pinterest) + **Copy link**
12. **6-icon claims strip** (repeated from the marquee): Diabetic Friendly · Gut-Healthy Ingredients · No Preservatives · 100% Natural · High in Fiber & Protein · Japanese Retort Technology
13. **"Product Related"** — 3-up cross-sell grid of other products
14. **"Recently Viewed Products"** — empty-state placeholder
15. **Footer**

*(Note: this specific PDP threw a template error in the raw fetch — `Liquid error (layout/theme line 287): Error in tag 'section' - 'nov-page-sizeguide' is not a valid section type` — a broken/misconfigured size-guide section block on the live theme.)*

---

## 7. Contact Us (`/pages/contact-us`)

**Meta:** Title "Get In Touch"

1. **Breadcrumb**: Home / Get In Touch
2. **Heading**: "Get in touch" — "Please enter the details of your requesst[sic]. A member of our support staff will respond as soon as possible." (note: typo "requesst" on the live site)
3. **Contact form** (fields not fully enumerated in the static fetch — likely name/email/subject/message + Submit)
4. **Contact details block**: Address — *Kayapoyil, Kakkara PO, Payyannur, Kannur, Kerala, 670306* (note: this is a **shorter/different address format** than the footer's — see §9, another content inconsistency) · Email — `support@kaicho.in` · Call — `+91 87927 99631`
5. **Social icons** row (Facebook / Instagram / YouTube / LinkedIn)
6. **Footer**

---

## 8. Blog (`/blogs/blogs`)

**Meta:** Title "Healthy Food Blog \| Millet Porridge, Protein & Nutrition \| Kaicho"

- **9 posts total**, paginated 3 pages (4 shown per page in the grid on page 1 per the fetch, though the page reports "4 items" visually and "9 item(s)" in the pager text — minor pagination-label inconsistency)
- Each card: featured image, title (linked), publish date, excerpt, "Read More" link
- **Posts found across the homepage teaser + blog listing (7–9 confirmed):**
  1. *Common Mistakes to Avoid While Following a Karkidaka Diet* — Aug 01, 2026
  2. *Navadhanya Kanji: The Super Food for Karikadakam Month* — Jun 19, 2026
  3. *Veg Oats Porridge vs Chicken Oats Porridge: Which One Should You Choose?* — Jun 08, 2026
  4. *Is Oats Good for Weight Loss? Everything You Need to Know* — Jun 08, 2026
  5. *Struggling to Get Enough Protein? Here's the Simple Fix* — May 05, 2026
  6. *Do You Really Need Protein Powder? Here's the Truth* — May 05, 2026
  7. *Retort Technology Explained: How Kaicho Foods Keeps Healthy Meals Fresh, Safe, and Full of Taste* — Sep 18, 2025
  8. *Porridge and Gut Happiness: Why Simple Foods Like Navadhanya Kanji and Mixed Millet Porridge are the Best Food for Gut Health* — Sep 18, 2025
  9. *(one more post exists per the "9 item(s)" count / page-3 pagination — not surfaced in either fetch)*
- Individual blog post page template not fetched — happy to pull one if you want the full article layout (hero image, byline/date, body, related-posts block, etc.).

---

## 9. Footer (identical on every page)

- Logo
- **"Contact US"** block: *Kaicho Foods, No.EKP.8/293, Kayapoyil, Kakkara PO, Via MM Bazar, Kannur, Kerala - 670306, India.* · `hello@kaicho.in` · `+91 87927 99631` · **FSSAI LIC No: 21325250000413**
- **"Follow Us"** — Facebook, Instagram, YouTube, LinkedIn (note: footer social links use a slightly different Facebook URL format than the separate social-icon block described in §7/§1 — `facebook.com/profile.php?id=...` vs. `facebook.com/people/Kaicho-Foods/...`, both pointing at what's presumably the same page)
- **"Payment Methods"** — 4 generic payment icons (from `cdn-icons-png.flaticon.com`, i.e. **stock icons, not actual gateway logos** — Visa/Mastercard/UPI/etc. branding isn't actually wired up)
- **Policy links**: Terms of Service · Privacy Policy · Shipping Policy · Refund Policy (all under `/policies/...`)
- Copyright line: "Copyright © 2026 Kaicho Foods. All Rights Reserved"

---

## 10. Notable Findings / Flags (useful if this feeds a rebuild)

- **The entire site is Shopify**, not custom-coded — every "section" here is a Shopify theme section/block, which is why banner copy lives inside images rather than as real text, and why several sections (How It Works, banner sets) appear to render twice in the raw HTML (separate desktop/mobile section instances, a common Shopify theme pattern rather than a bug).
- **Real price/discount inconsistency between the homepage and the collection page** for at least 5 of the 12 products (§6) — worth resolving regardless of what you build next.
- **Nav menu order and label wording differ between the homepage and inner pages** (§1) — "About" vs "About Us," "Contact" vs "Contact Us," and Blog/Products swap order.
- **B2B page has no real content** beyond the lead-gen form, despite SEO metadata pitching it as a dedicated clinics/wellness-centre offering (§5).
- **Contact page address is shorter/differently formatted** than the footer address (§7 vs §9) — same business, two slightly different address strings live on the site simultaneously.
- **A broken theme section** on at least the sampled PDP (`nov-page-sizeguide` Liquid error, §6).
- **Payment method icons in the footer are generic stock icons**, not real gateway branding.
- **Variant pickers render on every product card even though every product currently has exactly one variant** ("Default Title") — dead UI surface right now, but the data model is already variant-ready for whenever real variants (size, flavor, etc.) get added.

---

*This is a content/structure snapshot, not a pixel design spec — the actual visual styling (colors, spacing, exact banner imagery) lives in the theme's CSS and the banner image files themselves, neither of which is captured by a text fetch. Say the word if you want me to pull the literal blog-post bodies, the full testimonial quotes verbatim, the remaining 9 individual product pages, or screenshots of specific pages via a browser for the actual visual layout.*
