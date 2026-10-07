"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { IconArrowRight, IconChevronRight } from "../ui/icons";
import BowlSteam from "./BowlSteam";
import styles from "./Hero.module.css";

const PRODUCTS = [
  { name: "Chicken Oats Porridge", heading: "Chicken Oats", secondLine: "Porridge", description: "A nourishing meal, ready in minutes.", image: "Chicken-Oats.png", desktopImage: "desktop-Chicken-Oats.png" },
  { name: "Broccoli & Mushroom Oats Porridge", heading: "Broccoli & Mushroom", secondLine: "Oats Porridge", description: "Veggie goodness, ready in minutes.", image: "Broccolli.png", desktopImage: "desktop-Broccolli.png" },
  { name: "Mixed Millet Porridge", heading: "Mixed Millet", secondLine: "Porridge", description: "Wholesome millets, ready in minutes.", image: "Mixed-Millet.png", desktopImage: "desktop-Mixed-Millet.png" },
  { name: "Navadhanya Porridge", heading: "Navadhanya", secondLine: "Porridge", description: "Nine grains, one nourishing bowl.", image: "Navadhanya.png", desktopImage: "desktop-navadhanya.png" },
] as const;

const FEATURES = [
  { lines: ["100%", "Natural"], image: "icon_Layer_1.png", width: 40 },
  { lines: ["No", "Preservatives"], image: "icon_Layer_2.png", width: 30 },
  { lines: ["Diabetic", "Friendly"], image: "icon_Layer_3.png", width: 36 },
  { lines: ["High in Fiber", "& Protein"], image: "icon_Layer_4.png", width: 40 },
] as const;

const SLIDE_DURATION = 6000;
const ENTER_DURATION = 700;
const EXIT_DURATION = 700;
const HOLD_DURATION = SLIDE_DURATION - EXIT_DURATION;
const INITIAL_SLIDE = 2;

function productIndex(slide: number) {
  return ((slide % PRODUCTS.length) + PRODUCTS.length) % PRODUCTS.length;
}

export default function Hero() {
  const [slide, setSlide] = useState(INITIAL_SLIDE);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [manualChange, setManualChange] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const currentSlide = useRef(INITIAL_SLIDE);
  const pendingSlide = useRef<number | null>(null);
  const moving = useRef(false);
  const hasMoved = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const active = productIndex(slide);
  const product = PRODUCTS[active];

  const slideTo = useCallback((target: number) => {
    if (reducedMotion) {
      pendingSlide.current = null;
      currentSlide.current = target;
      moving.current = false;
      hasMoved.current = true;
      setSlide(target);
      setOutgoing(null);
      setTransitioning(false);
      return;
    }
    if (moving.current) {
      pendingSlide.current = target;
      return;
    }
    if (productIndex(target) === productIndex(currentSlide.current)) return;

    // Retain the previous image until its slow exit has completely finished.
    setOutgoing(productIndex(currentSlide.current));
    setDirection(target > currentSlide.current ? 1 : -1);
    pendingSlide.current = null;
    currentSlide.current = target;
    moving.current = true;
    hasMoved.current = true;
    setSlide(target);
    setTransitioning(true);
  }, [reducedMotion]);

  useEffect(() => {
    if (!transitioning) return;
    const timeout = window.setTimeout(() => {
      moving.current = false;
      setTransitioning(false);
      setOutgoing(null);
      const target = pendingSlide.current;
      pendingSlide.current = null;
      if (target !== null) slideTo(target);
    }, EXIT_DURATION + 34);
    return () => window.clearTimeout(timeout);
  }, [slide, transitioning, slideTo]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(window.scrollY / 600, 1);
      hero.style.setProperty("--scroll-zoom", String(1 + progress * 0.08));
      hero.style.setProperty("--scroll-zoom-bg", String(1 + progress * 0.05));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      hero.style.removeProperty("--scroll-zoom");
      hero.style.removeProperty("--scroll-zoom-bg");
    };
  }, [reducedMotion]);

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
    if (interacting || reducedMotion || !visible || transitioning) return;
    const timeout = window.setTimeout(() => {
      setManualChange(false);
      slideTo(currentSlide.current + 1);
    }, hasMoved.current ? HOLD_DURATION : SLIDE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [slide, transitioning, interacting, reducedMotion, visible, slideTo]);

  function moveProduct(direction: number) {
    setManualChange(true);
    slideTo((pendingSlide.current ?? currentSlide.current) + direction);
  }

  function showProduct(index: number) {
    setManualChange(true);
    const base = currentSlide.current;
    let distance = (index - productIndex(base) + PRODUCTS.length) % PRODUCTS.length;
    if (distance > PRODUCTS.length / 2) distance -= PRODUCTS.length;
    slideTo(base + distance);
  }

  return (
    <section
      ref={heroRef}
      id="home"
      className={styles.hero}
      data-motion-paused={interacting || !visible || undefined}
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
        <picture>
          <source media="(min-width: 1024px)" srcSet="/hero-page/desktop_bg_kaicho.png" />
          <Image src="/hero-page/mobile_bg_kaicho.png" alt="" fill loading="eager" fetchPriority="high" unoptimized sizes="100vw" className={styles.leaves} />
        </picture>
      </div>

      <div className={styles.content}>
        <div className={styles.copy} aria-live={manualChange ? "polite" : "off"} aria-atomic="true">
          <p className={styles.eyebrow}>Ready to eat</p>
          <h1 className={styles.title}>
            <span>{product.heading}</span>{" "}
            <span>{product.secondLine}</span>
          </h1>
          <p className={styles.description}>{product.description}</p>
        </div>

        <div
          className={styles.productStage}
          data-product-stage
          data-slide={slide}
          data-transitioning={transitioning || undefined}
          style={{
            "--enter-duration": `${ENTER_DURATION}ms`,
            "--exit-duration": `${EXIT_DURATION}ms`,
            "--slide-direction": direction,
          } as CSSProperties}
          role="group"
          aria-roledescription="slide"
          aria-label={`${active + 1} of ${PRODUCTS.length}: ${product.name}`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              moveProduct(event.key === "ArrowLeft" ? -1 : 1);
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
              moveProduct(distance < 0 ? 1 : -1);
            }
          }}
          onTouchCancel={() => { touchStart.current = null; }}
        >
          <div className={styles.productSlider} data-product-slider>
            {PRODUCTS.map((item, index) => (
              <div
                key={item.image}
                className={[
                  styles.productSlide,
                  index === active ? styles.activeSlide : "",
                  index === active && transitioning ? styles.incomingSlide : "",
                  index === outgoing ? styles.outgoingSlide : "",
                ].filter(Boolean).join(" ")}
                aria-hidden={index !== active}
                data-product-slide={item.image}
                data-slide-state={index === active ? transitioning ? "incoming" : "active" : index === outgoing ? "outgoing" : "inactive"}
              >
                <div className={styles.productReveal}>
                  <picture>
                    <source media="(min-width: 1024px)" srcSet={`/hero-page/product-images/${item.desktopImage}`} />
                  <Image
                    src={`/hero-page/product-images/${item.image}`}
                    alt={index === active ? `Kaicho ${item.name} pack with a freshly served bowl` : ""}
                    width={280}
                    height={280}
                    unoptimized
                    preload={index === INITIAL_SLIDE}
                    loading={index === INITIAL_SLIDE ? undefined : "eager"}
                    sizes="(min-width: 1920px) 920px, (min-width: 1024px) 46vw, (min-width: 560px) 378px, 68vw"
                    className={styles.productImage}
                  />
                  </picture>
                  <BowlSteam />
                </div>
              </div>
            ))}
          </div>
        </div>

        <ul className={styles.features} aria-label="Our food promise">
          {FEATURES.map((feature) => (
            <li key={feature.image}>
              <span className={styles.featureArtwork}>
                <Image src={`/hero-page/${feature.image}`} width={feature.width} height={40} alt="" unoptimized className={styles.featureIcon} />
              </span>
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
        </div>
      </div>
      <button type="button" className={`${styles.productArrow} ${styles.previous}`} aria-label="Previous meal" onClick={() => moveProduct(-1)}>
        <IconChevronRight className="h-5 w-5 rotate-180" />
      </button>
      <button type="button" className={`${styles.productArrow} ${styles.next}`} aria-label="Next meal" onClick={() => moveProduct(1)}>
        <IconChevronRight className="h-5 w-5" />
      </button>
    </section>
  );
}
