import { FlyingMisc } from "./LainPet/classes/FlyingMisc";
import { LainPet } from "./LainPet/classes/LainPet";
import { Navi } from "./LainPet/classes/Navi";
import { assets } from "./LainPet/data/assets";
import { magnitude, subtract, type Vector2 } from "./LainPet/types/Vector2";

const OUTFITS = ["default", "school", "pink", "bear", "home"] as const;
type Outfit = (typeof OUTFITS)[number];

type LainPetApi = {
  start(): void;
  stop(): void;
  forceRoll(): void;
  forceBurn(): void;
  forceDance(): void;
  specialEvent(): void;
  dropNavi(): boolean;
  sugarRush(): void;
  setOutfit(outfit: Outfit): void;
  spawnCrow(): boolean;
  spawnGirl(): boolean;
  speak(text?: string): void;
  express(): void;
  moveTo(target: Vector2): void;
  getPosition(): Vector2 | null;
};

declare global {
  interface Window {
    Lain?: LainPetApi;
    LainPet?: LainPetApi;
  }
}

const lainPet = new LainPet();
const navi = new Navi(assets.misc.navi);
const flyingMisc = new FlyingMisc({
  crow: assets.misc.crow,
  girl: assets.misc.girl,
});

let ambientInterval: number | null = null;
let outfitInterval: number | null = null;
let naviInterval: number | null = null;

function updateNaviInteraction() {
  if (!navi.isLanded()) return;

  const lainPosition = lainPet.getPosition();
  const naviPosition = navi.getPosition();

  if (!lainPosition || !naviPosition) return;

  lainPet.moveTo(naviPosition);

  const lainCenter = {
    x: lainPosition.x + 50,
    y: lainPosition.y + 50,
  };
  const naviCenter = {
    x: naviPosition.x + 60,
    y: naviPosition.y + 60,
  };

  if (magnitude(subtract(lainCenter, naviCenter)) >= 30) return;
  if (!navi.collect()) return;

  lainPet.sugarRush();
  lainPet.speak("NAVI COLLECTED.");
}

function startAmbientBehavior() {
  if (ambientInterval !== null) return;

  ambientInterval = window.setInterval(() => {
    if (Math.random() < 0.2) lainPet.speak();
    if (Math.random() < 0.2) lainPet.express();
    if (Math.random() < 0.1) {
      flyingMisc.spawn(Math.random() < 0.5 ? "crow" : "girl");
    }
    if (Math.random() < 0.05) navi.drop();
  }, 15000);

  outfitInterval = window.setInterval(() => {
    const randomOutfit = OUTFITS[Math.floor(Math.random() * OUTFITS.length)];

    lainPet.wear(randomOutfit);

    if (Math.random() < 0.4) {
      lainPet.specialEvent();
    }
  }, 60000);

  naviInterval = window.setInterval(updateNaviInteraction, 30);
}

function stopAmbientBehavior() {
  if (ambientInterval !== null) {
    window.clearInterval(ambientInterval);
    ambientInterval = null;
  }

  if (outfitInterval !== null) {
    window.clearInterval(outfitInterval);
    outfitInterval = null;
  }

  if (naviInterval !== null) {
    window.clearInterval(naviInterval);
    naviInterval = null;
  }
}

function start() {
  lainPet.start();
  startAmbientBehavior();
  console.log(
    "%c Lain Pet by realmxrza | standalone browser snippet started ",
    "background: #000; color: #f0f; font-weight: bold; font-size: 14px;",
  );
}

function stop() {
  stopAmbientBehavior();
  navi.stop();
  flyingMisc.stop();
  lainPet.stop();
  console.log(
    "%c Lain Pet by realmxrza | standalone browser snippet stopped ",
    "background: #000; color: #f0f; font-weight: bold; font-size: 14px;",
  );
}

const api: LainPetApi = {
  start,
  stop,
  forceRoll: () => lainPet.forceRoll(),
  forceBurn: () => lainPet.forceBurn(),
  forceDance: () => lainPet.forceDance(),
  specialEvent: () => lainPet.specialEvent(),
  dropNavi: () => navi.drop(),
  sugarRush: () => lainPet.sugarRush(),
  setOutfit: (outfit) => lainPet.wear(outfit),
  spawnCrow: () => flyingMisc.spawn("crow"),
  spawnGirl: () => flyingMisc.spawn("girl"),
  speak: (text) => lainPet.speak(text),
  express: () => lainPet.express(),
  moveTo: (target) => lainPet.moveTo(target),
  getPosition: () => lainPet.getPosition(),
};

function install() {
  window.LainPet?.stop();
  window.LainPet = api;
  window.Lain = api;

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

install();
