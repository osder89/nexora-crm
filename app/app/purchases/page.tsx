import { redirect } from "next/navigation";

export default function PurchasesIndexPage() {
  redirect("/app/purchases/orders");
}
