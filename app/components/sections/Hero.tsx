"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconChevronRight } from "../ui/icons";
import BowlSteam from "./BowlSteam";
import styles from "./Hero.module.css";

const PRODUCTS = [
  { name: "Chicken Oats Porridge", heading: "Chicken Oats", secondLine: "Porridge", description: "A nourishing meal, ready in minutes.", image: "Chicken-Oats.png" },
  { name: "Broccoli & Mushroom Oats Porridge", heading: "Broccoli & Mushroom", secondLine: "Oats Porridge", description: "Veggie goodness, ready in minutes.", image: "Broccolli.png" },
  { name: "Mixed Millet Porridge", heading: "Mixed Millet", secondLine: "Porridge", description: "Wholesome millets, ready in minutes.", image: "Mixed-Millet.png" },
  { name: "Navadhanya Porridge", heading: "Navadhanya", secondLine: "Porridge", description: "Nine grains, one nourishing bowl.", image: "Navadhanya.png" },
] as const;

const FEATURES = [
  { lines: ["100%", "Natural"], image: "icon_Layer_1.png", width: 40 },
  { lines: ["No", "Preservatives"], image: "icon_Layer_2.png", width: 30 },
  { lines: ["Diabetic", "Friendly"], image: "icon_Layer_3.png", width: 36 },
  { lines: ["High in Fiber", "& Protein"], image: "icon_Layer_4.png", width: 40 },
] as const;

const SLIDE_DURATION = 2000;

export default function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [manualChange, setManualChange] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const product = PRODUCTS[active];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    let inView = true;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    }, { threshold: 0.15 });
    if (heroRef.current) observer.observe(heroRef.current);
    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused || interacting || reducedMotion || !visible) return;
    const timeout = window.setTimeout(() => {
      setManualChange(false);
      setActive((index) => (index + 1) % PRODUCTS.length);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [active, paused, interacting, reducedMotion, visible]);

  function showProduct(index: number) {
    setManualChange(true);
    setActive((index + PRODUCTS.length) % PRODUCTS.length);
  }

  return (
    <section
      ref={heroRef}
      id="home"
      className={styles.hero}
      data-motion-paused={paused || interacting || !visible || undefined}
      aria-label="Kaicho ready-to-eat meals"
      aria-roledescription="carousel"
      onFocusCapture={(event) => {
        setInteracting(event.target.matches(":focus-visible"));
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
    >
      <div className={styles.foliage} aria-hidden="true">
        <Image src="/hero-page/mobile_bg_kaicho.png" alt="" fill preload unoptimized sizes="100vw" className={styles.leaves} />
      </div>

      <div className={styles.content}>
        <div className={styles.copy} aria-live={manualChange ? "polite" : "off"} aria-atomic="true">
          <h1 className={`${styles.title} ${active === 1 ? styles.longTitle : ""}`}>
            <span>{product.heading}</span>{" "}
            <span>{product.secondLine}</span>
          </h1>
          <p>{product.description}</p>
        </div>

        <div
          className={styles.productStage}
          role="group"
          aria-roledescription="slide"
          aria-label={`${active + 1} of ${PRODUCTS.length}: ${product.name}`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              showProduct(active + (event.key === "ArrowLeft" ? -1 : 1));
            }
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const distance = touch.clientX - start.x;
            if (Math.abs(distance) > 40 && Math.abs(distance) > Math.abs(touch.clientY - start.y)) {
              showProduct(active + (distance < 0 ? 1 : -1));
            }
          }}
          onTouchCancel={() => { touchStart.current = null; }}
          onPointerMove={(event) => {
            if (reducedMotion || event.pointerType !== "mouse") return;
            const bounds = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty("--tilt-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 6}deg`);
            event.currentTarget.style.setProperty("--tilt-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * -6}deg`);
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.setProperty("--tilt-x", "0deg");
            event.currentTarget.style.setProperty("--tilt-y", "0deg");
          }}
        >
          <div className={styles.productTilt}>
            <div className={styles.productFloat}>
              {PRODUCTS.map((item, index) => (
                <div key={item.image} className={`${styles.productSlide} ${index === active ? styles.activeSlide : ""}`} aria-hidden={index !== active} data-product-slide={item.image}>
                  <div className={styles.productReveal}>
                    <Image
                      src={`/hero-page/product-images/${item.image}`}
                      alt={index === active ? `Kaicho ${item.name} pack with a freshly served bowl` : ""}
                      width={280}
                      height={280}
                      unoptimized
                      preload={index === 0}
                      loading={index === 0 ? undefined : "eager"}
                      sizes="(min-width: 1024px) 540px, (min-width: 768px) 440px, 68vw"
                      className={styles.productImage}
                    />
                    <BowlSteam />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="button" className={`${styles.productArrow} ${styles.previous}`} aria-label="Previous meal" onClick={() => showProduct(active - 1)}>
            <IconChevronRight className="h-5 w-5 rotate-180" />
          </button>
          <button type="button" className={`${styles.productArrow} ${styles.next}`} aria-label="Next meal" onClick={() => showProduct(active + 1)}>
            <IconChevronRight className="h-5 w-5" />
          </button>
        </div>

        <ul className={styles.features} aria-label="Our food promise">
          {FEATURES.map((feature) => (
            <li key={feature.image}>
              <Image src={`/hero-page/${feature.image}`} width={feature.width} height={40} alt="" unoptimized className={styles.featureIcon} />
              <p>{feature.lines.map((line) => <span key={line}>{line}</span>)}</p>
            </li>
          ))}
        </ul>

        <Link href="/products" className={styles.cta}>
          Explore Our Meals
          <IconArrowRight aria-hidden="true" className={styles.ctaArrow} />
        </Link>

        <div className={styles.controls} aria-label="Meal slideshow controls">
          <div className={styles.dots}>
            {PRODUCTS.map((item, index) => (
              <button key={item.image} type="button" aria-label={`Show ${item.name}`} aria-pressed={index === active} onClick={() => showProduct(index)}>
                <span className={index === active ? styles.selectedDot : ""} />
              </button>
            ))}
          </div>
          {!reducedMotion && (
            <button type="button" className={styles.pause} aria-label={paused ? "Play meal slideshow" : "Pause meal slideshow"} onClick={() => setPaused((value) => !value)}>
              {paused ? <span className={styles.playIcon} /> : <span className={styles.pauseIcon} />}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
