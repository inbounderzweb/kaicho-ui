import Image from "next/image";
import ProductRangeSlider from "../components/b2b/ProductRangeSlider";
import { FiArrowRight, FiBox, FiBriefcase, FiCheckCircle, FiClipboard, FiCoffee, FiHeart, FiHome, FiLayers, FiMapPin, FiPackage, FiShield, FiShoppingBag, FiTruck, FiUsers } from "react-icons/fi";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import B2BInquiry from "../components/b2b/B2BInquiry";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Bulk Orders & B2B",
  description: "Partner with Kaicho for corporate orders, retail partnerships, events, catering and institutional supply. Get in touch for bulk pricing.",
  path: "/b2b",
});

const benefits = [
  { Icon: FiShield, title: "Thoughtfully Selected", text: "Traditional ingredients, chosen with care." },
  { Icon: FiCheckCircle, title: "Consistent Quality", text: "Careful sourcing and attention to every pack." },
  { Icon: FiPackage, title: "Wholesome Product Range", text: "Convenient meals for everyday routines." },
  { Icon: FiTruck, title: "Supply That Fits", text: "Plan quantities and delivery with our team." },
];
const partners = [
  { Icon: FiHeart, title: "Hospitals" }, { Icon: FiHome, title: "Clinics" },
  { Icon: FiClipboard, title: "Pharmacies" }, { Icon: FiUsers, title: "Wellness Centers" },
  { Icon: FiBriefcase, title: "Corporate Offices" }, { Icon: FiCoffee, title: "Catering & Events" },
  { Icon: FiShoppingBag, title: "Retail & Resellers" }, { Icon: FiHome, title: "Educational Institutions" },
];
const strengths = [
  { Icon: FiShield, title: "Clean Ingredients", text: "Simple food, thoughtfully made." },
  { Icon: FiLayers, title: "Rooted in Tradition", text: "Traditional wisdom for modern routines." },
  { Icon: FiHeart, title: "Everyday Nourishment", text: "Wholesome options for your menu." },
  { Icon: FiBox, title: "Flexible Quantities", text: "Discuss the volume your business needs." },
  { Icon: FiCoffee, title: "Easy to Prepare", text: "Convenient to serve and enjoy." },
  { Icon: FiUsers, title: "Dedicated Support", text: "A team to help you plan your order." },
];
const products = [
  { name: "Veg Oats Porridge", image: "/kaicho-hero.png" },
  { name: "Chicken Oats Porridge", image: "/kaicho-chickenoats.png" },
  { name: "Navadhanya Porridge", image: "/image_navadhanya.png" },
  { name: "Broccoli & Mushroom Oats Porridge", image: "/Broccoli-&-Mushroom-Oats-Porridge.png" },
];
const eyebrow = "text-xs font-bold uppercase tracking-[0.18em] text-brand-dark";
const heading = "mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl";

export default function B2BPage() {
  return (
    <div>
      <section className="overflow-hidden bg-linear-to-r from-[#edf8f1] via-[#f5faf6] to-[#f5f0e5]">
        <Container className="grid items-center gap-4 pt-10 lg:grid-cols-2 lg:gap-8 lg:py-14">
          <div className="relative z-10 pb-6 lg:py-6">
            <p className={eyebrow}>B2B Partnership</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Partner With <span className="text-brand-dark">Kaicho</span></h1>
            <h2 className="mt-4 max-w-lg text-xl font-semibold leading-snug sm:text-2xl">Bringing Traditional Wellness Solutions to Modern Businesses</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-ink-muted">Collaborate with us for corporate orders, retail partnerships, events, catering and institutional supply. Experience the goodness of traditional nutrition, made for today.</p>
            <ul className="my-7 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[{ Icon: FiClipboard, title: "Custom Pricing" }, { Icon: FiBox, title: "Flexible Quantities" }, { Icon: FiTruck, title: "Delivery Planning" }, { Icon: FiUsers, title: "Dedicated Support" }].map(({ Icon, title }) => (
                <li key={title} className="flex flex-col items-start gap-2 text-sm font-semibold"><span className="rounded-full bg-brand/10 p-3 text-brand-dark"><Icon aria-hidden="true" className="h-5 w-5" /></span>{title}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3"><Button href="#inquiry">Get a Quote <FiArrowRight aria-hidden="true" /></Button><Button href="/products" variant="ghost">Explore Our Range <FiArrowRight aria-hidden="true" /></Button></div>
          </div>
          <div className="relative min-w-0">
            <Image src="/kaicho-hero.png" alt="Kaicho Veg Oats Porridge with a freshly prepared bowl" width={1536} height={1024} sizes="(min-width: 1024px) 50vw, 100vw" preload className="h-auto w-full rounded-t-[3rem] object-contain lg:rounded-[3rem]" />
            <p className="my-5 text-center font-display text-lg italic text-brand-dark">Tradition nourishes tomorrow.</p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="my-8 grid gap-4 rounded-2xl border border-brand/10 bg-[#f7fbf8] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-brand/10 p-4 text-sm font-semibold"><FiBriefcase aria-hidden="true" className="h-7 w-7 shrink-0 text-brand-dark" /> Supplying wellness to businesses across India</div>
          {[{ title: "Business Partnerships", text: "Built around your needs" }, { title: "Bulk Supply", text: "Flexible order quantities" }, { title: "Personal Support", text: "From inquiry to delivery" }].map(item => <div key={item.title} className="flex flex-col justify-center px-4 py-2"><p className="font-display text-lg font-semibold text-brand-dark">{item.title}</p><p className="mt-1 text-sm text-ink-muted">{item.text}</p></div>)}
        </div>

        <section aria-labelledby="b2b-range" className="grid gap-8 py-8 lg:grid-cols-[0.8fr_1.6fr] lg:items-center">
          <div><p className={eyebrow}>Our Range</p><h2 id="b2b-range" className={heading}>Wholesome Nutrition for <span className="text-brand-dark">Every Need</span></h2><p className="mt-4 leading-7 text-ink-muted">Explore our range of traditional, ready-to-eat products — ideal for bulk orders and institutional supply.</p><Button href="/products" variant="outline" className="mt-5">View All Products <FiArrowRight aria-hidden="true" /></Button></div>
          <ProductRangeSlider products={products} />
        </section>

        <section aria-labelledby="b2b-benefits" className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="relative min-h-80 overflow-hidden rounded-2xl sm:min-h-96"><Image src="/kaicho-lifestyle-banner.jpg" alt="Enjoying Kaicho porridge at home" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" /><div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" /><p className="absolute bottom-8 left-6 right-6 max-w-xs font-display text-3xl font-semibold leading-tight text-white">Healthy people.<br />Stronger communities.</p></div>
          <div><p className={eyebrow}>Why Partner With Kaicho?</p><h2 id="b2b-benefits" className={heading}>More Than a Supplier,<br />A Food Partner</h2><p className="mt-4 leading-7 text-ink-muted">We combine traditional wisdom with modern food technology to deliver convenient, nutritious and great-tasting products.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{benefits.map(({ Icon, title, text }, i) => <article key={title} className={`rounded-xl p-5 ${i === 1 ? "bg-[#f8f3e9]" : "bg-[#eff8f2]"}`}><Icon aria-hidden="true" className="mb-3 h-9 w-9 rounded-full bg-brand/10 p-2 text-brand-dark" /><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{text}</p></article>)}</div></div>
        </section>

        <section aria-labelledby="partner-types" className="pb-12 pt-4"><h2 id="partner-types" className={`${eyebrow} text-center`}>Who Can Partner With Us?</h2><ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">{partners.map(({ Icon, title }) => <li key={title} className="flex flex-col items-center justify-center gap-4 rounded-xl border border-brand/10 bg-[#f8fbf9] px-3 py-6 text-center text-sm font-medium shadow-sm"><Icon aria-hidden="true" className="h-7 w-7 text-brand-dark" />{title}</li>)}</ul></section>
      </Container>

      <section aria-labelledby="nutrition-trust" className="bg-[#eff8f2] py-12 sm:py-16"><Container className="grid gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:items-center"><div><p className={eyebrow}>For Clinics & Practitioners</p><h2 id="nutrition-trust" className={heading}>Nutrition You<br />Can Trust</h2><p className="mt-4 max-w-md leading-7 text-ink-muted">Bring convenient, wholesome food to your practice, workplace or community. Talk to us about the right products for your needs.</p><Button href="#inquiry" className="mt-6">Partner With Us <FiArrowRight aria-hidden="true" /></Button></div><div className="grid gap-3 sm:grid-cols-2">{strengths.map(({ Icon, title, text }) => <article key={title} className="flex items-start gap-3 rounded-xl bg-white/80 p-4"><span className="rounded-full bg-brand/10 p-3 text-brand-dark"><Icon aria-hidden="true" className="h-5 w-5" /></span><div className="min-w-0"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-5 text-ink-muted">{text}</p></div></article>)}</div></Container></section>

      <section aria-labelledby="partnership-steps" className="py-12 sm:py-16"><Container><p className={eyebrow}>Let’s Work Together</p><h2 id="partnership-steps" className={heading}>A Simple Start to Your Partnership</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{[{ title: "Share Your Requirements", text: "Tell us about your business, quantities and preferred products." }, { title: "Plan Your Order", text: "Our team will discuss pricing, availability and delivery with you." }, { title: "Grow Together", text: "Keep in touch for repeat orders as your requirements grow." }].map((step, i) => <article key={step.title} className="rounded-2xl bg-[#f5f7f6] p-6"><span className="font-display text-2xl font-semibold text-brand-dark">0{i + 1}</span><h3 className="mt-3 font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{step.text}</p></article>)}</div></Container></section>

      <section id="inquiry" aria-labelledby="inquiry-title" className="scroll-mt-24 bg-linear-to-br from-[#eff8f2] via-[#f7fbf8] to-[#e4f3e8] py-12 sm:py-16"><Container className="grid items-start gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14"><div><p className={eyebrow}>Get in Touch</p><h2 id="inquiry-title" className={heading}>Looking for<br /><span className="text-brand-dark">Huge Quantity?</span></h2><p className="mt-4 max-w-sm leading-7 text-ink-muted">Fill in your details and our team will get back to you to discuss bulk pricing.</p><div className="relative mt-8 aspect-[4/3] max-w-sm overflow-hidden rounded-2xl"><Image src="/image_navadhanya.png" alt="Kaicho Navadhanya porridge for your next bulk order" fill sizes="(min-width: 1024px) 360px, 90vw" className="object-contain" /></div><p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-dark"><FiMapPin aria-hidden="true" /> Let’s grow together.</p></div><B2BInquiry /></Container></section>
    </div>
  );
}
