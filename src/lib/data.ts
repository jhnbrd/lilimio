export const cities = [
  {
    id: "davao",
    name: "Davao City",
    region: "Davao Region",
    latitude: 7.0731,
    longitude: 125.6128,
  },
  {
    id: "manila",
    name: "Manila",
    region: "Metro Manila",
    latitude: 14.5995,
    longitude: 120.9842,
  },
  {
    id: "cebu",
    name: "Cebu City",
    region: "Central Visayas",
    latitude: 10.3157,
    longitude: 123.8854,
  },
  {
    id: "quezon",
    name: "Quezon City",
    region: "Metro Manila",
    latitude: 14.676,
    longitude: 121.0437,
  },
  {
    id: "baguio",
    name: "Baguio City",
    region: "Cordillera",
    latitude: 16.4023,
    longitude: 120.596,
  },
  {
    id: "iloilo",
    name: "Iloilo City",
    region: "Western Visayas",
    latitude: 10.7202,
    longitude: 122.5621,
  },
];
export type City = (typeof cities)[number];
export const places = [
  {
    id: 1,
    name: "People’s Park",
    kind: "Shaded areas",
    address: "Palma Gil Street, Davao City",
    lat: 7.0739,
    lng: 125.6111,
    description:
      "A public urban park with mature trees and landscaped walking paths. Check access and opening hours with the park before visiting.",
    amenities: ["Tree cover", "Walking paths"],
    image: "/park-landscape.webp",
  },
  {
    id: 2,
    name: "SM City Davao",
    kind: "Cooling spaces",
    address: "Quimpo Boulevard, Davao City",
    lat: 7.0494,
    lng: 125.5885,
    description:
      "An indoor commercial destination. Public access, cooling facilities, and operating hours require on-site verification.",
    amenities: ["Indoor space", "Seating to verify"],
    image: "/park-landscape.webp",
  },
  {
    id: 3,
    name: "Rizal Park",
    kind: "Shaded areas",
    address: "San Pedro Street, Davao City",
    lat: 7.0639,
    lng: 125.6087,
    description:
      "An outdoor civic park near City Hall. Availability of shaded seating and facilities requires verification.",
    amenities: ["Public park", "Tree cover to verify"],
    image: "/park-landscape.webp",
  },
];
export type Place = {
  id: number | string;
  name: string;
  kind: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  amenities: string[];
  image?: string;
  distanceKm?: number;
  osm?: {
    url: string;
    fetchedAt: string;
    access?: string;
    openingHours?: string;
    airConditioning?: string;
    shade?: string;
    fee?: string;
  };
};
export const guides = [
  {
    id: "illness",
    title: "Recognize heat-related illness",
    subtitle: "Know the signs. Know when to act.",
    category: "Essential",
    color: "coral",
    icon: "heart",
    intro:
      "Heat-related illness can progress quickly. Recognize warning signs and help someone cool down.",
    tips: [
      "Stop activity and move to a shaded or air-conditioned place if you feel dizzy, weak, nauseated, or develop a headache.",
      "Cool the body with wet cloths, a cool shower, and moving air. Have someone stay nearby.",
      "Confusion, collapse, seizures, or loss of consciousness can mean heatstroke. Call your local emergency number (911 in the Philippines and US) and begin cooling immediately.",
      "Do not give drinks to someone who is confused, unconscious, or unable to swallow.",
    ],
    source:
      "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
  },
  {
    id: "hydration",
    title: "Stay hydrated",
    subtitle: "Small sips. A cooler, better day.",
    category: "For everyone",
    color: "blue",
    icon: "water",
    intro:
      "Hot weather increases the need for fluids. Keep drinking water within reach throughout your day.",
    tips: [
      "Drink water regularly, even before you feel thirsty.",
      "Carry a refillable bottle and plan where you can safely refill it.",
      "Avoid alcohol and limit very sugary drinks in hot weather.",
      "If you have a medical fluid restriction, follow your clinician’s advice.",
    ],
    source:
      "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
  },
  {
    id: "vulnerable",
    title: "Protect vulnerable people",
    subtitle: "Extra care for those who need it.",
    category: "Families",
    color: "sage",
    icon: "users",
    intro:
      "Older adults, infants, and people with chronic conditions can be more vulnerable to heat.",
    tips: [
      "Check in on older relatives, neighbors, and anyone living alone.",
      "Keep children in cool spaces and offer water as appropriate for their age.",
      "Never leave anyone in a parked vehicle, even for a short time.",
      "Ask a clinician about heat precautions when taking medicines or managing chronic illness.",
    ],
    source:
      "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
  },
  {
    id: "outdoors",
    title: "Prepare for outdoor activities",
    subtitle: "A little planning goes a long way.",
    category: "Outdoors",
    color: "yellow",
    icon: "sun",
    intro:
      "Reduce heat exposure by adjusting your schedule, clothing, and rest breaks.",
    tips: [
      "Compare forecasts and choose cooler hours where possible.",
      "Keep drinking water with you and drink regularly. Follow your clinician’s advice if you have a fluid restriction.",
      "Take frequent shaded or cooled breaks. Stop if you feel unwell.",
      "For demanding outdoor work, follow an employer’s heat-safety plan. This app cannot set occupational exposure limits.",
    ],
    source:
      "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
  },
  {
    id: "home",
    title: "Homes and communities",
    subtitle: "Keep indoor spaces cooler.",
    category: "For everyone",
    color: "yellow",
    icon: "home",
    intro:
      "Reduce indoor heat and check on people who may need help finding a cool space.",
    tips: [
      "When outdoors is hotter than indoors, block direct sunlight with blinds or shutters.",
      "Open windows after dark when outdoor air is cooler and it is safe to do so.",
      "Switch off unnecessary electrical devices that add heat indoors.",
      "Check on people living alone and help them reach a cool place if needed.",
    ],
    source:
      "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
  },
  {
    id: "facts",
    title: "Myths vs. facts",
    subtitle: "Understand what heat exposure means.",
    category: "Essential",
    color: "blue",
    icon: "facts",
    intro:
      "Heat exposure depends on more than the temperature shown on a thermometer.",
    tips: [
      "Humidity, wind, clothing, and physical activity all affect the body’s ability to lose heat.",
      "Indoor spaces can also overheat; being indoors does not automatically mean conditions are cool.",
      "Heat can worsen existing illnesses, so check on people with health conditions.",
      "A shaded forecast does not describe direct sun exposure. Check conditions and take cooling breaks.",
    ],
    source:
      "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
  },
];
