import { NightSkyExplorer } from "@/features/night-sky";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
          나의 오늘 밤 하늘
        </h1>
        <p className="text-muted-foreground">
          날짜와 나라를 고르면 그곳의 하늘이 낮인지 밤인지, 어떤 행성과 별자리가 보이는지 알려 줘요.
        </p>
      </header>
      <NightSkyExplorer />
    </main>
  );
}
