"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "../ui/Container";
import JsonLd from "../seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { IconChevronRight, IconHeart, IconLeaf, IconShieldCheck, IconWheat } from "../ui/icons";
import styles from "./ProductsHero.module.css";

const FEATURES = [
  { title: "100% Natural", Icon: IconLeaf },
  { title: "No Preservatives", Icon: IconShieldCheck },
  { title: "Ready in Minutes", Icon: IconHeart },
  { title: "Wholesome Meals", Icon: IconWheat },
];
const BANNERS = [
  { src: "/product-page/product-banner-desk1.png", name: "Navadhanya Porridge", alt: "Kaicho Navadhanya Porridge with a bowl of porridge and grains" },
  { src: "/product-page/product-banner-desk2.png", name: "Mixed Millet Porridge", alt: "Kaicho Mixed Millet Porridge with a bowl of porridge, millets and nuts" },
  { src: "/product-page/product-banner-desk3.png", name: "Broccoli & Mushroom Oats Porridge", alt: "Kaicho Broccoli and Mushroom Oats Porridge with fresh vegetables and oats" },
];

export default function ProductsHero() {
  const [active, setActive] = useState(0);
  function move(direction: number) {
    setActive(index => (index + direction + BANNERS.length) % BANNERS.length);
  }
  return (
    <section className={styles.hero} aria-label="Our products" aria-roledescription="carousel">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }])} />
      <div className={styles.artwork}>
        {BANNERS.map((banner, index) => (
          <div key={banner.src} id={`product-banner-${index}`} className={`${styles.slide} ${index === active ? styles.active : ""}`} aria-hidden={index !== active} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${BANNERS.length}: ${banner.name}`}>
            <Image src={banner.src} alt={banner.alt} fill sizes="100vw" preload={index === 0} className={styles.image} />
          </div>
        ))}
      </div>
      <Container className={styles.content}>
        <div className={styles.copy}>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <Link href="/" className="hover:text-brand">Home</Link><IconChevronRight className="h-3.5 w-3.5" /><span aria-current="page" className="font-semibold text-ink">Products</span>
          </nav>
          <p className={styles.eyebrow}>READY-TO-EAT, ALWAYS FRESH</p>
          <h1>Our Products</h1>
          <p className={styles.description}>Healthy, ready-to-eat meals, combos and saver packs for busy lifestyles.</p>
          <div className={styles.features}>
            {FEATURES.map(({ title, Icon }) => <div key={title}><span><Icon className="h-5 w-5" strokeWidth={1.7} /></span><p>{title}</p></div>)}
          </div>
        </div>
      </Container>
      <div className={styles.controls}>
        <button type="button" aria-label="Previous product banner" onClick={() => move(-1)}><IconChevronRight className="h-4 w-4 rotate-180" /></button>
        <div className={styles.dots}>{BANNERS.map((banner, index) => <button key={banner.src} type="button" aria-label={`Show ${banner.name}`} aria-pressed={active === index} aria-controls={`product-banner-${index}`} onClick={() => setActive(index)}><span className={active === index ? styles.selectedDot : ""} /></button>)}</div>
        <button type="button" aria-label="Next product banner" onClick={() => move(1)}><IconChevronRight className="h-4 w-4" /></button>
      </div>
    </section>
  );
}
