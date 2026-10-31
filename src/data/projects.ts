export type ProjectImage = {
  src: string;
  alt: string;
};

export type Project = {
  id: string;
  title: string;
  year: string;
  role: string;
  tags: string[];
  summary: string;
  description: string;
  cover: ProjectImage;
  gallery: ProjectImage[];
};

/**
 * Add your own images under /public/projects and point `src` here.
 * Example: src: "/projects/valley-cover.jpg"
 */
export const projects: Project[] = [
  {
    id: "chocolate-byna-overview",
    title: "Chocolate ByNa — Overview",
    year: "2026",
    role: "UX/UI design & front-end development",
    tags: ["Web", "E-commerce", "UI/UX"],
    summary:
      "A friendly bilingual ordering experience for a neighborhood cake shop, designed around clear browsing, pickup, and cart flows.",
    description:
      "Chocolate ByNa is a web-based cake shop experience that turns a small neighborhood bakery into an approachable online storefront. I designed and developed the Vietnamese and English shopping flow around three main needs: discovering products, understanding each treat, and completing pickup orders with confidence. The interface combines a soft café palette, playful mascot artwork, responsive layouts, and clear product information. I also integrated a practical shopping cart, language switching, inventory-aware ordering, and a warm visual system that keeps the brand personal across desktop and mobile screens.",
    cover: {
      src: "/projects/chocolate-byna/chocolatebyna-home.png",
      alt: "Chocolate ByNa homepage with illustrated cat mascot",
    },
    gallery: [
      {
        src: "/projects/chocolate-byna/tiramisu.png",
        alt: "Chocolate tiramisu product presented in an order interface",
      },
      {
        src: "/projects/chocolate-byna/matcha-tiramisu.png",
        alt: "Matcha tiramisu product presented in an order interface",
      },
      {
        src: "/projects/chocolate-byna/butter-toek.png",
        alt: "Butter rolls in a pink checked takeaway box",
      },
      {
        src: "/projects/chocolate-byna/brand-cat.png",
        alt: "Chocolate ByNa cat mascot brand artwork",
      },
    ],
  },
  {
    id: "chocolate-byna-shopping",
    title: "Shopping Experience",
    year: "2026",
    role: "Product design & UX research",
    tags: ["User Flow", "Checkout", "Bilingual UX"],
    summary:
      "A simple storefront journey that helps customers discover treats, personalize their order, and arrange pickup.",
    description:
      "The shopping experience was designed around the short decision-making path of a neighborhood bakery customer. Product cards present clear names, prices, and appetizing imagery, while Vietnamese and English language switching keeps the full menu accessible. The cart supports quantity changes, pickup-oriented ordering, and the selection of extra options without forcing users through an overly complex checkout. The key design goal was to make every step feel immediate, friendly, and easy to understand on both desktop and mobile.",
    cover: {
      src: "/projects/chocolate-byna/tiramisu.png",
      alt: "Chocolate tiramisu in the Chocolate ByNa ordering experience",
    },
    gallery: [
      {
        src: "/projects/chocolate-byna/chocolatebyna-home.png",
        alt: "Chocolate ByNa storefront homepage",
      },
      {
        src: "/projects/chocolate-byna/matcha-tiramisu.png",
        alt: "Matcha tiramisu menu item",
      },
    ],
  },
  {
    id: "chocolate-byna-products",
    title: "Product & Visual Design",
    year: "2026",
    role: "Visual identity & content design",
    tags: ["Branding", "Illustration", "Visual Design"],
    summary:
      "A soft, playful visual identity built around handmade cakes, warm colors, and a memorable cat mascot.",
    description:
      "Chocolate ByNa's visual language blends confectionery warmth with the charm of an everyday neighborhood shop. I used soft pastel colors, expressive bakery illustrations, generous rounded surfaces, and clear product photography to create a consistent identity across the homepage, menu, story, and pickup areas. The cat mascot acts as a recognizable brand character while playful labels and food-focused details give the experience a friendly personality without reducing readability.",
    cover: {
      src: "/projects/chocolate-byna/brand-cat.png",
      alt: "Chocolate ByNa illustrated cat brand artwork",
    },
    gallery: [
      {
        src: "/projects/chocolate-byna/butter-toek.png",
        alt: "Fresh butter rolls in Chocolate ByNa packaging",
      },
      {
        src: "/projects/chocolate-byna/tiramisu.png",
        alt: "Chocolate tiramisu product visual",
      },
      {
        src: "/projects/chocolate-byna/chocolatebyna-home.png",
        alt: "The complete Chocolate ByNa visual homepage",
      },
    ],
  },
  {
    id: "chocolate-byna-system",
    title: "Bilingual Web System",
    year: "2026",
    role: "Front-end development & interaction design",
    tags: ["Responsive Web", "React", "Bilingual"],
    summary:
      "A responsive, bilingual web system with cart interactions, pickup order handling, and inventory-aware product management.",
    description:
      "Beyond the visual interface, Chocolate ByNa is implemented as a practical responsive web experience. The system supports English and Vietnamese, maintains the cart throughout the shopping flow, handles product availability, and presents pickup information clearly. Reusable product cards, navigation, language controls, and order components create a consistent structure across screen sizes. I focused on preserving a lightweight feel while ensuring that business-critical actions such as changing quantities, reviewing an order, and selecting pickup options remain understandable.",
    cover: {
      src: "/projects/chocolate-byna/chocolatebyna-home.png",
      alt: "Responsive Chocolate ByNa website homepage",
    },
    gallery: [
      {
        src: "/projects/chocolate-byna/brand-cat.png",
        alt: "Chocolate ByNa brand mascot used throughout the web system",
      },
      {
        src: "/projects/chocolate-byna/matcha-tiramisu.png",
        alt: "Bilingual product catalog item",
      },
      {
        src: "/projects/chocolate-byna/butter-toek.png",
        alt: "Product content shown in the web experience",
      },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find((project) => project.id === id);
}
