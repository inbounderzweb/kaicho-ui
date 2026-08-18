import { IconWhatsapp } from "../ui/icons";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/918792799631"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 lg:bottom-6"
    >
      <IconWhatsapp className="h-7 w-7" />
    </a>
  );
}
