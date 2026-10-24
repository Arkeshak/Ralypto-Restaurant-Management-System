import type { MenuItem } from "@/api/types";

// The seeded API menu contains no photo field yet. Reuse the dish photos that
// already shipped with the frontend demo and provide category-appropriate
// fallbacks so every live menu item has a food image.
const photos = {
  kottu: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=720&auto=format&fit=crop&q=85",
  meat: "https://images.unsplash.com/photo-1544025162-d76694265947?w=720&auto=format&fit=crop&q=85",
  seafoodRice: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=720&auto=format&fit=crop&q=85",
  rice: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=720&auto=format&fit=crop&q=85",
  seafood: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=720&auto=format&fit=crop&q=85",
  chicken: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=720&auto=format&fit=crop&q=85",
  lime: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=720&auto=format&fit=crop&q=85",
  falooda: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=720&auto=format&fit=crop&q=85",
  dessert: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=720&auto=format&fit=crop&q=85",
} as const;

function fallbackFor(item: Pick<MenuItem, "name">): string {
  const name = item.name.toLowerCase();
  if (name.includes("kottu") || name.includes("kothu")) return name.includes("beef") || name.includes("cheese") ? photos.meat : photos.kottu;
  if (name.includes("fried rice") || name.includes("biryani")) return name.includes("seafood") ? photos.seafoodRice : photos.rice;
  if (name.includes("cuttlefish") || name.includes("seafood") || name.includes("fish")) return photos.seafood;
  if (name.includes("chicken") || name.includes("beef") || name.includes("mutton")) return photos.chicken;
  if (name.includes("juice") || name.includes("lime") || name.includes("coconut") || name.includes("tea")) return photos.lime;
  if (name.includes("falooda") || name.includes("milo") || name.includes("drink")) return photos.falooda;
  if (name.includes("watalappan") || name.includes("pudding") || name.includes("curd") || name.includes("dessert")) return photos.dessert;
  return photos.meat;
}

export function menuItemImageUrl(item: MenuItem): string {
  return item.imageUrl?.trim() || fallbackFor(item);
}

export function fallbackMenuItemImageUrl(item: MenuItem): string {
  return fallbackFor(item);
}
