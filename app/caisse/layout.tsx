// Layout caisse
import { Toaster } from "@/components/ui/Toast";

export default function CaisseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
