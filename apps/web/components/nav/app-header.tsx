import Image from "next/image";

const HUK_LOGO =
  "https://static.c.huk24.de/content/dam/huk24/web/allgemein/%C3%BCber-uns/HUK_Logo_gelb_nachtblau_RGB_800x800px.png";

export function AppHeader() {
  return (
    <header className="shrink-0 flex items-center justify-center px-5 pt-5 pb-3">
      <Image
          src={HUK_LOGO}
          alt="HUK Logo"
          width={36}
          height={36}
          className="object-cover"
        />
      <span className="text-xs font-black tracking-tight text-foreground leading-none">
        JUNGE WELT
      </span>
    </header>
  );
}
