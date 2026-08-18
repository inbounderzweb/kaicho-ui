/**
 * Rich per-product detail copy (ingredients, benefits, instructions, specs)
 * keyed by product slug. Only products with real authored content appear
 * here — ProductDetailClient falls back to the base short description +
 * tags from product-data.ts for any product without an entry, rather than
 * fabricating ingredient/benefit copy that isn't real.
 */

export type ProductDetailContent = {
  category: string[];
  shortDescription: string;
  fullDescription: string;
  ingredients: { name: string; benefit: string }[];
  benefits: { title: string; description: string }[];
  heatingInstructions: string;
  storageInstructions: string;
  allergenInfo: string;
  dietaryPreferences: string;
  productForm: string;
  shelfLife: string;
  packagingType: string;
  origin: string;
  comboPricing?: string;
};

export const PRODUCT_DETAILS: Record<string, ProductDetailContent> = {
  "navadhanya-porridge": {
    category: ["Home", "Navadhanya Collection", "Packaged Food"],
    shortDescription:
      "Healthy meal | Ready-to-eat meal | Millet porridge | High-fiber & protein-rich meal — Navadhanya Porridge is a wholesome, ready-to-eat porridge made with 9 traditional grains, inspired by Kerala's traditional wellness practices.",
    fullDescription:
      "Healthy meal | Ready-to-eat meal | Millet porridge | High-fiber & protein-rich meal Navadhanya Porridge is a wholesome, ready-to-eat porridge made with 9 traditional grains, inspired by Kerala's traditional wellness practices. A nourishing blend of millets, pulses, seeds, and traditional rice cooked in coconut milk, this healthy porridge offers a balanced combination of fiber, protein, and essential nutrients. Packed using Japanese retort technology, it retains freshness, taste, and nutrition for months together without the use of preservatives. A convenient traditional Indian meal for busy days, wellness routines, and anyone looking for a gut-friendly and nutritious meal.",
    ingredients: [
      {
        name: "Flaxseed",
        benefit:
          "A source of plant-based Omega-3 fatty acids, dietary fiber, and antioxidants, flaxseed supports gut health and adds nutritional value to this millet porridge.",
      },
      {
        name: "Foxtail Millet",
        benefit: "A fiber-rich millet that supports better digestion and enhances overall gut health.",
      },
      {
        name: "Bengal Gram Dal",
        benefit: "Rich in plant-based protein and nutrients, it supports immunity and contributes to a balanced meal.",
      },
      {
        name: "Broken Wheat",
        benefit: "A good source of dietary fiber, broken wheat supports digestion and helps maintain energy levels for a long period of time.",
      },
      {
        name: "Urad Dal",
        benefit: "A key source of plant-based protein and complex carbohydrates, which provides sustained energy throughout the day.",
      },
      {
        name: "Finger Millet (Ragi)",
        benefit: "Known for its high calcium content, ragi supports bone health and adds essential nutrients.",
      },
      {
        name: "Green Gram",
        benefit: "A nutrient-rich legume, it's rich in proteins, vitamins, and minerals, providing a plethora of benefits for your health.",
      },
      {
        name: "Fenugreek",
        benefit: "Traditionally valued for supporting digestion and heart health, fenugreek is a super spice of benefits.",
      },
      {
        name: "Navara Rice",
        benefit: "A traditional Kerala rice variety famous for its nutritional values, supporting overall wellness, and adding authenticity to this traditional porridge.",
      },
    ],
    benefits: [
      {
        title: "Supports Digestion & Gut Health",
        description:
          "Made with naturally fiber-rich grains and seeds, Navadhanya Porridge is gentle on the stomach and supports healthy digestion. The combination of grains helps improve bowel regularity and makes it a good choice for gut-friendly diets.",
      },
      {
        title: "Sustained Energy & Satiety",
        description:
          "A balanced mix of carbohydrates and plant-based proteins helps keep you full and energized for long hours. The diverse grain blend also provides essential amino acids that support overall well-being.",
      },
      {
        title: "Supports Bone Health",
        description:
          "Rich in calcium from millets like ragi and nutrient-dense seeds, this porridge helps strengthen bones and helps meet daily mineral requirements.",
      },
      {
        title: "Helps with Weight & Blood Sugar Management",
        description:
          "With fiber-rich ingredients, Navadhanya Porridge slows glucose absorption and helps maintain energy levels, which makes it a suitable choice for those looking for a diabetic-friendly or weight-conscious meal option.",
      },
      {
        title: "Supports Immunity",
        description:
          "The combination of traditional grains like green gram and ragi, pulses, and seeds provides essential nutrients, antioxidants, and minerals that boost immunity.",
      },
      {
        title: "Nutrient-Dense Traditional Nutrition",
        description:
          "Bringing together nine powerful ingredients in one meal, this traditional Kerala porridge or kanji offers a wholesome balance of grains, legumes, and seeds for everyday nourishment.",
      },
    ],
    heatingInstructions:
      "Cut open the pouch, transfer contents to a bowl, and heat for 2–3 minutes. Alternatively, immerse the sealed pouch in hot water for 5 minutes.",
    storageInstructions: "Store in a cool, dry place. Once opened, consume immediately or refrigerate.",
    allergenInfo: "Contains gluten.",
    dietaryPreferences: "Vegetarian, natural ingredients.",
    productForm: "Ready-to-Eat Porridge",
    shelfLife: "8 months",
    packagingType: "Retort pouch",
    origin: "Made in India",
    comboPricing: "Pack of 10 - ₹1500",
  },
};
