import { CategoryPage } from "@/components/pages/CategoryPage";

/**
 * The route is fixed; the content behind it is not. Title, description, hero
 * copy, highlights and products all come from the collection record the admin
 * manages, so this file never needs editing again.
 */
export function AntiqueJewelleryPage() {
  return <CategoryPage path="/antique-jewellery" />;
}
